import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";
import { FALLBACK_CATEGORIES } from "../data/fallbackData.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("categories").select("*");
  if (error || !data?.length) {
    return res.json(FALLBACK_CATEGORIES);
  }
  res.json(data);
});

router.get("/:id/services", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("category_id", id);
  if (error) return res.status(400).json({ error: error.message });
  if (!data?.length) {
    return res.status(404).json({ error: "لا توجد خدمات لهذه الفئة" });
  }
  res.json(data);
});
router.post("/", requireAuth, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name مطلوب" });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name, description }])
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const { data, error } = await supabase
    .from("categories")
    .update({ name, description })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Category not found" });
  res.json(data);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "تم حذف التصنيف بنجاح" });
});

export default router;