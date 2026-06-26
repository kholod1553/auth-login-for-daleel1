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

// GET /settings/notifications - جلب كل إشعارات المستخدم
router.get("/notifications", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /settings/notifications - إنشاء إشعار جديد
router.post("/notifications", requireAuth, async (req, res) => {
  const { title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "title و message مطلوبين" });
  }

  const { data, error } = await req.supabase
    .from("notifications")
    .insert([{
      user_id: req.user.id,
      title,
      message,
      type: type || "general",
      is_read: false, // ✅ الإشعار الجديد بيكون غير مقروء
    }])
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// ✅ PUT /settings/notifications/:id/toggle - تبديل حالة is_read
router.put("/notifications/:id/toggle", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // جلب الـ notification الحالي
    const { data: notification, error: fetchError } = await req.supabase
      .from("notifications")
      .select("is_read")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (fetchError) return res.status(400).json({ error: fetchError.message });
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    // عكس القيمة (toggle)
    const newIsRead = !notification.is_read;

    // تحديث القيمة
    const { data, error } = await req.supabase
      .from("notifications")
      .update({ is_read: newIsRead })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: `Notification marked as ${newIsRead ? "read" : "unread"}`,
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT /settings/notifications/read-all - تحديد كل الإشعارات كمقروءة
router.put("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", req.user.id)
      .eq("is_read", false)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: `Marked ${data.length} notifications as read`,
      count: data.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /settings/notifications - تحديث إعدادات الإشعارات (تفعيل/تعطيل صوت واهتزاز)
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
