import { Hono } from "hono";
import { PatronPushTokensTable } from "../../utils/tables";
import { patronAuth } from "../middleware/patronAuth";

const app = new Hono<{ Bindings: CloudflareBindings; Variables: { patronId: string } }>();

app.use("*", patronAuth);

app.post("/", async (c) => {
  const { token, platform } = await c.req.json<{ token: string; platform: "ios" | "android" }>();
  if (!token || (platform !== "ios" && platform !== "android")) {
    return c.json({ error: "token et platform (ios|android) requis" }, 400);
  }

  const tokens = PatronPushTokensTable(c.env);
  const existant = await tokens.findOne({ where: { token } });
  if (existant) {
    if (existant.patron_id !== c.get("patronId")) {
      await tokens.update(existant.id, { patron_id: c.get("patronId") });
    }
    return c.json({ ok: true });
  }

  await tokens.create({ patron_id: c.get("patronId"), token, platform });
  return c.json({ ok: true }, 201);
});

export default app;
