import { Hono } from "hono";
import { EmployesTable } from "../../utils/tables";
import { deviceAuth } from "../middleware/deviceAuth";
import { verifyPassword } from "../lib/password";

const app = new Hono<{ Bindings: CloudflareBindings; Variables: { etablissementId: string } }>();

app.use("*", deviceAuth);

app.get("/", async (c) => {
  const employes = await EmployesTable(c.env).findAll({ where: { etablissement_id: c.get("etablissementId") } });
  return c.json(employes.map(({ password_hash, password_salt, ...reste }) => reste));
});

app.post("/verify", async (c) => {
  const { telephone, password } = await c.req.json<{ telephone: string; password: string }>();
  const employe = await EmployesTable(c.env).findOne({
    where: { etablissement_id: c.get("etablissementId"), telephone },
  });
  if (!employe || !(await verifyPassword(password, employe.password_hash, employe.password_salt))) {
    return c.json({ error: "Numéro ou mot de passe invalide" }, 401);
  }

  const { password_hash, password_salt, ...reste } = employe;
  return c.json(reste);
});

export default app;
