import { Hono } from "hono";
import { PatronsTable } from "../../utils/tables";
import { hashPassword, verifyPassword } from "../lib/password";
import { signPatronToken } from "../lib/jwt";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/signup", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  if (!email || !password) return c.json({ error: "email et password requis" }, 400);

  const patrons = PatronsTable(c.env);
  const existant = await patrons.findOne({ where: { email } });
  if (existant) return c.json({ error: "Cet email est déjà utilisé" }, 400);

  const { hash, salt } = await hashPassword(password);
  const patron = await patrons.create({ email, password_hash: hash, password_salt: salt });
  const token = await signPatronToken(patron.id, c.env.JWT_SECRET);
  return c.json({ token, patron: { id: patron.id, email: patron.email } }, 201);
});

app.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  if (!email || !password) return c.json({ error: "email et password requis" }, 400);

  const patrons = PatronsTable(c.env);
  const patron = await patrons.findOne({ where: { email } });
  if (!patron || !(await verifyPassword(password, patron.password_hash, patron.password_salt))) {
    return c.json({ error: "Email ou mot de passe invalide" }, 401);
  }

  const token = await signPatronToken(patron.id, c.env.JWT_SECRET);
  return c.json({ token, patron: { id: patron.id, email: patron.email } });
});

export default app;
