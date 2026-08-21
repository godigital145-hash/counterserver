import { Hono } from "hono";
import { EtablissementsTable, RapportsTable, EmployesTable } from "../../utils/tables";
import { patronAuth } from "../middleware/patronAuth";
import { genererPairingCode, pairingCodeExpiresAt } from "../lib/pairingCode";
import { hashPassword } from "../lib/password";
import { compterAppareils, MAX_APPAREILS } from "../lib/appareils";

const ROLES_EMPLOYE = ["gerant", "serveur", "caissier"] as const;
type RoleEmploye = (typeof ROLES_EMPLOYE)[number];

function sansSecret<T extends { password_hash: string; password_salt: string }>(
  employe: T
): Omit<T, "password_hash" | "password_salt"> {
  const { password_hash, password_salt, ...reste } = employe;
  return reste;
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: { patronId: string } }>();

app.use("*", patronAuth);

app.post("/", async (c) => {
  const { nom, type } = await c.req.json<{ nom: string; type: string }>();
  if (!nom || !type) return c.json({ error: "nom et type requis" }, 400);

  const etab = await EtablissementsTable(c.env).create({
    patron_id: c.get("patronId"),
    nom,
    type,
    pairing_code: genererPairingCode(),
    pairing_code_expires_at: pairingCodeExpiresAt(),
    device_token_hash: null,
    paired_at: null,
  });

  return c.json(etab, 201);
});

app.get("/", async (c) => {
  const etabs = await EtablissementsTable(c.env).findAll({ where: { patron_id: c.get("patronId") } });
  const avecNombreAppareils = await Promise.all(
    etabs.map(async (etab) => ({ ...etab, nombre_appareils: await compterAppareils(c.env, etab) }))
  );
  return c.json(avecNombreAppareils);
});

app.get("/:id", async (c) => {
  const etab = await EtablissementsTable(c.env).findOne({
    where: { id: c.req.param("id"), patron_id: c.get("patronId") },
  });
  if (!etab) return c.json({ error: "not found" }, 404);
  return c.json({ ...etab, nombre_appareils: await compterAppareils(c.env, etab) });
});

app.post("/:id/pairing-code", async (c) => {
  const etablissements = EtablissementsTable(c.env);
  const etab = await etablissements.findOne({ where: { id: c.req.param("id"), patron_id: c.get("patronId") } });
  if (!etab) return c.json({ error: "not found" }, 404);

  if ((await compterAppareils(c.env, etab)) >= MAX_APPAREILS) {
    return c.json({ error: `Nombre maximum de ${MAX_APPAREILS} appareils déjà atteint pour cet établissement` }, 400);
  }

  const pairing_code = genererPairingCode();
  const pairing_code_expires_at = pairingCodeExpiresAt();
  await etablissements.update(etab.id, {
    pairing_code,
    pairing_code_expires_at,
  });

  return c.json({ pairing_code, pairing_code_expires_at });
});

app.get("/:id/rapports", async (c) => {
  const etab = await EtablissementsTable(c.env).findOne({
    where: { id: c.req.param("id"), patron_id: c.get("patronId") },
  });
  if (!etab) return c.json({ error: "not found" }, 404);

  const rapports = await RapportsTable(c.env).findAll({
    where: { etablissement_id: etab.id },
    orderBy: { column: "date_generation", direction: "DESC" },
  });
  return c.json(rapports);
});

app.post("/:id/employes", async (c) => {
  const etab = await EtablissementsTable(c.env).findOne({
    where: { id: c.req.param("id"), patron_id: c.get("patronId") },
  });
  if (!etab) return c.json({ error: "not found" }, 404);

  const { nom, telephone, password, role } = await c.req.json<{
    nom: string;
    telephone: string;
    password: string;
    role: RoleEmploye;
  }>();
  if (!nom || !telephone || !password || !ROLES_EMPLOYE.includes(role)) {
    return c.json({ error: "nom, telephone, password et role (gerant|serveur|caissier) requis" }, 400);
  }

  const employes = EmployesTable(c.env);
  const existant = await employes.findOne({ where: { etablissement_id: etab.id, telephone } });
  if (existant) return c.json({ error: "Ce numéro de téléphone est déjà utilisé dans cet établissement" }, 400);

  const { hash, salt } = await hashPassword(password);
  const employe = await employes.create({
    etablissement_id: etab.id,
    nom,
    telephone,
    password_hash: hash,
    password_salt: salt,
    role,
    password_updated_at: new Date().toISOString(),
  });

  return c.json(sansSecret(employe), 201);
});

app.get("/:id/employes", async (c) => {
  const etab = await EtablissementsTable(c.env).findOne({
    where: { id: c.req.param("id"), patron_id: c.get("patronId") },
  });
  if (!etab) return c.json({ error: "not found" }, 404);

  const employes = await EmployesTable(c.env).findAll({ where: { etablissement_id: etab.id } });
  return c.json(employes.map(sansSecret));
});

app.patch("/:id/employes/:employeId", async (c) => {
  const etab = await EtablissementsTable(c.env).findOne({
    where: { id: c.req.param("id"), patron_id: c.get("patronId") },
  });
  if (!etab) return c.json({ error: "not found" }, 404);

  const employes = EmployesTable(c.env);
  const employe = await employes.findOne({ where: { id: c.req.param("employeId"), etablissement_id: etab.id } });
  if (!employe) return c.json({ error: "not found" }, 404);

  const body = await c.req.json<{ nom?: string; telephone?: string; password?: string; role?: RoleEmploye }>();
  if (body.role && !ROLES_EMPLOYE.includes(body.role)) {
    return c.json({ error: "role invalide" }, 400);
  }
  if (body.telephone && body.telephone !== employe.telephone) {
    const doublon = await employes.findOne({ where: { etablissement_id: etab.id, telephone: body.telephone } });
    if (doublon) return c.json({ error: "Ce numéro de téléphone est déjà utilisé dans cet établissement" }, 400);
  }

  const changements: Partial<typeof employe> = {};
  if (body.nom) changements.nom = body.nom;
  if (body.telephone) changements.telephone = body.telephone;
  if (body.role) changements.role = body.role;
  if (body.password) {
    const { hash, salt } = await hashPassword(body.password);
    changements.password_hash = hash;
    changements.password_salt = salt;
    changements.password_updated_at = new Date().toISOString();
  }

  const mis_a_jour = await employes.update(employe.id, changements);
  if (!mis_a_jour) return c.json({ error: "not found" }, 404);
  return c.json(sansSecret(mis_a_jour));
});

app.delete("/:id/employes/:employeId", async (c) => {
  const etab = await EtablissementsTable(c.env).findOne({
    where: { id: c.req.param("id"), patron_id: c.get("patronId") },
  });
  if (!etab) return c.json({ error: "not found" }, 404);

  const employes = EmployesTable(c.env);
  const employe = await employes.findOne({ where: { id: c.req.param("employeId"), etablissement_id: etab.id } });
  if (!employe) return c.json({ error: "not found" }, 404);

  await employes.delete(employe.id);
  return c.json({ ok: true });
});

export default app;
