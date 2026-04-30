import express from "express";
import { supabase } from "../supabaseClient.js";
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

export default router;
