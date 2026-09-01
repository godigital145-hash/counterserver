import { Hono } from "hono";
import { CategoriesTable, ProduitsTable } from "../../utils/tables";
import { deviceAuth } from "../middleware/deviceAuth";

const app = new Hono<{ Bindings: CloudflareBindings; Variables: { etablissementId: string } }>();

app.use("*", deviceAuth);

app.get("/", async (c) => {
  const etablissementId = c.get("etablissementId");
  const [categories, produits] = await Promise.all([
    CategoriesTable(c.env).findAll({ where: { etablissement_id: etablissementId } }),
    ProduitsTable(c.env).findAll({ where: { etablissement_id: etablissementId } }),
  ]);
  return c.json({ categories, produits });
});

export default app;
