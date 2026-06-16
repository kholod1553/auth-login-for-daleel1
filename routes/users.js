import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../supabaseClient.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, created_at")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    id:        req.user.id,
    name:      data.full_name  || '',
    email:     req.user.email,
    phone:     data.phone      || '',
    avatar:    data.avatar_url || '',
    createdAt: data.created_at,
  });
});

router.put("/me", requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  if (!name || name.trim().length < 2)
    return res.status(400).json({ error: "الاسم يجب أن يكون على الأقل حرفين" });

  if (name.trim().length > 25)
    return res.status(400).json({ error: "الاسم لا يتجاوز 25 حرف" });

  if (!phone || !/^(\+20|0)\d{10}$/.test(phone))
    return res.status(400).json({ error: "رقم الهاتف غير صحيح" });

  const { data, error } = await req.supabase
    .from("profiles")
    .update({
      full_name:  name.trim(),
      phone:      phone.trim(),
      updated_at: new Date(),
    })
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ name: data.full_name, phone: data.phone });
});

router.put("/me/avatar", requireAuth, async (req, res) => {
  const { base64, mimeType } = req.body;
  if (!base64 || !mimeType)
    return res.status(400).json({ error: "base64 and mimeType are required" });

  const buffer = Buffer.from(base64, "base64");
  const fileName = `${req.user.id}.${mimeType.split("/")[1]}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("profiles")
    .upload(fileName, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) return res.status(400).json({ error: uploadError.message });

  const { data: urlData } = supabaseAdmin.storage
    .from("profiles")
    .getPublicUrl(fileName);

  const { error: updateError } = await req.supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl, updated_at: new Date() })
    .eq("id", req.user.id);

  if (updateError) return res.status(400).json({ error: updateError.message });

  res.json({ avatar_url: urlData.publicUrl });
});

export default router;