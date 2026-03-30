import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET كل الخدمات (اختباري - لو عايز تحميه، أضف requireAuth)
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("services").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// GET خدماتي (محمي)
router.get("/my-services", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// POST إضافة خدمة جديدة (محمي)
router.post("/", requireAuth, async (req, res) => {
  const { title, description, price, location } = req.body;

  if (!title || !price) {
    return res.status(400).json({ error: "Title and price are required" });
  }

  const { data, error } = await supabase
    .from("services")
    .insert([{ user_id: req.user.id, title, description, price, location }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});

// PUT تعديل خدمة (محمي)
router.put("/:id", requireAuth, async (req, res) => {
  console.log("PUT /:id تم استدعاؤه! ID:", req.params.id);
  console.log("الـ user_id من التوكن:", req.user.id);

  const { id } = req.params;
  const { title, description, price, location } = req.body;

  if (!title && !description && !price && !location) {
    return res
      .status(400)
      .json({ error: "يجب إرسال حقل واحد على الأقل للتعديل" });
  }

  const { data, error } = await supabase
    .from("services")
    .update({ title, description, price, location })
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select();

  if (error) {
    console.log("خطأ في update:", error);
    return res.status(400).json({ error: error.message });
  }

  if (data.length === 0) {
    return res.status(404).json({ error: "الخدمة غير موجودة أو ليست ملكك" });
  }

  res.json({
    message: "تم التعديل بنجاح",
    updated: data[0],
  });
  // DELETE service
  router.delete("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) return res.status(400).json(error);

    res.json({ message: "Service deleted ✅" });
  });
});

export default router;
