import { createMiddleware } from "hono/factory";
import { verifyPatronToken } from "../lib/jwt";

export const patronAuth = createMiddleware<{
  Bindings: CloudflareBindings;
  Variables: { patronId: string };
}>(async (c, next) => {
  const auth = c.req.header("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const patronId = await verifyPatronToken(token, c.env.JWT_SECRET);
    c.set("patronId", patronId);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
