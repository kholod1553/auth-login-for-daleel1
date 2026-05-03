import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// admin client — بيتعمل مرة وبس
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

router.get("/me", requireAuth, (req, res) => {
  const user = req.user
  res.json({
    id:        user.id,
    name:      user.user_metadata?.name       || '',
    email:     user.email,
    phone:     user.user_metadata?.phone      || '',
    avatar:    user.user_metadata?.avatar_url || '',
    createdAt: user.created_at
  })
});

router.put("/me", requireAuth, async (req, res) => {
  const { name, phone, email } = req.body;

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    req.user.id,
    {
      email: email,
      user_metadata: { name, phone }
    }
  )

  if (error) return res.status(400).json({ error: error.message })

  res.json({
    id:    data.user.id,
    name:  data.user.user_metadata?.name  || '',
    email: data.user.email,
    phone: data.user.user_metadata?.phone || '',
  })
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
    .upload(fileName, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) return res.status(400).json({ error: uploadError.message });

  const { data: urlData } = req.supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    req.user.id,
    { user_metadata: { avatar_url: urlData.publicUrl } }
  )

  if (updateError) return res.status(400).json({ error: updateError.message });

  res.json({ avatar_url: urlData.publicUrl });
});

export default router;
