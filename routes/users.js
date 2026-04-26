import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.put("/me", requireAuth, async (req, res) => {
  const { name, phone, email } = req.body;
  const { data, error } = await req.supabase.auth.updateUser({
    email,
    data: { name, phone },
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.put("/me/avatar", requireAuth, async (req, res) => {
  const { base64, mimeType } = req.body;
  if (!base64 || !mimeType) {
    return res.status(400).json({ error: "base64 and mimeType are required" });
  }
  const buffer = Buffer.from(base64, "base64");
  const fileName = `${req.user.id}.${mimeType.split("/")[1]}`;
  const { error: uploadError } = await req.supabase.storage
    .from("avatars")
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });
  if (uploadError) return res.status(400).json({ error: uploadError.message });
  const { data: urlData } = req.supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);
  const { error: updateError } = await req.supabase.auth.updateUser({
    data: { avatar_url: urlData.publicUrl },
  });
  if (updateError) return res.status(400).json({ error: updateError.message });
  res.json({ avatar_url: urlData.publicUrl });
});

export default router;
