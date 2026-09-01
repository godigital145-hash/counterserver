import { Hono } from "hono";
import { EtablissementsTable, EtablissementDevicesTable } from "../../utils/tables";
import { genererDeviceToken, hashDeviceToken } from "../lib/deviceToken";
import { compterAppareils, MAX_APPAREILS } from "../lib/appareils";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/exchange", async (c) => {
  const { pairing_code, device_identifiant } = await c.req.json<{ pairing_code: string; device_identifiant?: string }>();
  if (!pairing_code) return c.json({ error: "pairing_code requis" }, 400);

  const etablissements = EtablissementsTable(c.env);
  const etab = await etablissements.findOne({ where: { pairing_code } });
  if (!etab || !etab.pairing_code_expires_at || etab.pairing_code_expires_at < new Date().toISOString()) {
    return c.json({ error: "Code invalide ou expiré" }, 400);
  }

  const appareils = EtablissementDevicesTable(c.env);
  const deviceToken = genererDeviceToken();
  const deviceTokenHash = await hashDeviceToken(deviceToken);

  // Un même appareil physique qui reprend un nouveau code (ex: après une rupture d'appariement
  // à la déconnexion) doit rester une seule ligne côté serveur, pas s'accumuler.
  const appareilExistant = device_identifiant
    ? await appareils.findOne({ where: { etablissement_id: etab.id, device_identifiant } })
    : null;

  if (appareilExistant) {
    await appareils.update(appareilExistant.id, { device_token_hash: deviceTokenHash, paired_at: new Date().toISOString() });
  } else {
    if ((await compterAppareils(c.env, etab)) >= MAX_APPAREILS) {
      return c.json({ error: `Nombre maximum de ${MAX_APPAREILS} appareils déjà atteint pour cet établissement` }, 400);
    }
    await appareils.create({
      etablissement_id: etab.id,
      device_token_hash: deviceTokenHash,
      device_identifiant: device_identifiant ?? null,
      paired_at: new Date().toISOString(),
    });
  }

  await etablissements.update(etab.id, {
    pairing_code: null,
    pairing_code_expires_at: null,
  });

  return c.json({ etablissement_id: etab.id, nom: etab.nom, type: etab.type, device_token: deviceToken });
});

export default app;
