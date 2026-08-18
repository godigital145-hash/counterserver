import { Hono } from "hono";
import { EtablissementsTable, RapportsTable } from "../../utils/tables";
import { patronAuth } from "../middleware/patronAuth";
import { genererPairingCode, pairingCodeExpiresAt } from "../lib/pairingCode";

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
  return c.json(etabs);
});

app.get("/:id", async (c) => {
  const etab = await EtablissementsTable(c.env).findOne({
    where: { id: c.req.param("id"), patron_id: c.get("patronId") },
  });
  if (!etab) return c.json({ error: "not found" }, 404);
  return c.json(etab);
});

app.post("/:id/pairing-code", async (c) => {
  const etablissements = EtablissementsTable(c.env);
  const etab = await etablissements.findOne({ where: { id: c.req.param("id"), patron_id: c.get("patronId") } });
  if (!etab) return c.json({ error: "not found" }, 404);

  const pairing_code = genererPairingCode();
  const pairing_code_expires_at = pairingCodeExpiresAt();
  await etablissements.update(etab.id, {
    pairing_code,
    pairing_code_expires_at,
    device_token_hash: null,
    paired_at: null,
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

export default app;
