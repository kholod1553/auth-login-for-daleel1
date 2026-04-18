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

export default router;
