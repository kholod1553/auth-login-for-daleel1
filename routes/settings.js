import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  let { data, error } = await req.supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });

  if (!data) {
    const { data: newSettings, error: insertError } = await req.supabase
      .from("user_settings")
      .insert([{ user_id: req.user.id }])
      .select()
      .maybeSingle();
    if (insertError) return res.status(400).json({ error: insertError.message });
    return res.json(newSettings);
  }

  res.json(data);
});

// PUT /settings/notifications
router.put("/notifications", requireAuth, async (req, res) => {
  const { notifications, sound, vibration } = req.body;
  const { data, error } = await req.supabase
    .from("user_settings")
    .update({ notifications, sound, vibration })
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PUT /settings/theme
router.put("/theme", requireAuth, async (req, res) => {
  const { dark_mode } = req.body;
  const { data, error } = await req.supabase
    .from("user_settings")
    .update({ dark_mode })
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PUT /settings/language
router.put("/language", requireAuth, async (req, res) => {
  const { language } = req.body;
  const { data, error } = await req.supabase
    .from("user_settings")
    .update({ language })
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
// POST /settings/clear-cache
router.post("/clear-cache", requireAuth, (req, res) => {
  res.json({ message: "تم مسح التخزين المؤقت بنجاح" });
});

export default router;
