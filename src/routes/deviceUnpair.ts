import { Hono } from "hono";
import { EtablissementsTable, EtablissementDevicesTable } from "../../utils/tables";
import { hashDeviceToken } from "../lib/deviceToken";
import { deviceAuth } from "../middleware/deviceAuth";

const app = new Hono<{ Bindings: CloudflareBindings; Variables: { etablissementId: string } }>();

app.use("*", deviceAuth);

app.delete("/", async (c) => {
  const auth = c.req.header("Authorization");
  const token = auth!.slice(7);
  const device_token_hash = await hashDeviceToken(token);

  const supprimes = await EtablissementDevicesTable(c.env).deleteWhere({ device_token_hash });
  if (supprimes === 0) {
    // Rétrocompatibilité : appareil apparié avant l'introduction de la table etablissement_devices.
    await EtablissementsTable(c.env).updateWhere({ device_token_hash }, { device_token_hash: null, paired_at: null });
  }

  return c.json({ ok: true });
});

export default app;
