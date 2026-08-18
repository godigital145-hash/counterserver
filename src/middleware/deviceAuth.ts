import { createMiddleware } from "hono/factory";
import { hashDeviceToken } from "../lib/deviceToken";
import { EtablissementsTable } from "../../utils/tables";

export const deviceAuth = createMiddleware<{
  Bindings: CloudflareBindings;
  Variables: { etablissementId: string };
}>(async (c, next) => {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const device_token_hash = await hashDeviceToken(token);
  const etab = await EtablissementsTable(c.env).findOne({ where: { device_token_hash } });
  if (!etab) return c.json({ error: "Unauthorized" }, 401);

  c.set("etablissementId", etab.id);
  await next();
});
