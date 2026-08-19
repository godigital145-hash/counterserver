import { Hono } from "hono";
import { RapportsTable } from "../../utils/tables";
import { deviceAuth } from "../middleware/deviceAuth";
import type { RapportRow } from "../../utils/db";

type RapportPushPayload = Omit<RapportRow, "id" | "etablissement_id" | "synced_at">;

const app = new Hono<{ Bindings: CloudflareBindings; Variables: { etablissementId: string } }>();

app.post("/", deviceAuth, async (c) => {
  const etablissementId = c.get("etablissementId");
  const b = await c.req.json<RapportPushPayload>();

  await RapportsTable(c.env).upsert({
    id: `${etablissementId}_${b.session_caisse_id}`,
    etablissement_id: etablissementId,
    ...b,
    synced_at: new Date().toISOString(),
  });

  await c.env.RAPPORTS_QUEUE.send({ etablissementId, sessionCaisseId: b.session_caisse_id });

  return c.json({ ok: true });
});

export default app;
