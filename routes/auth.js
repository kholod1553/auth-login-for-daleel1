import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.post("/register", async (req, res) => {
  const { email, password, name, phone, username, birthdate } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone, username, birthdate },
    },
  });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.post("/logout", requireAuth, async (req, res) => {
  const { error } = await req.supabase.auth.signOut();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "تم تسجيل الخروج بنجاح" });
});
router.post("/verify-otp", async (req, res) => {
  const { email, token, type } = req.body;

  if (!email || !token || !type) { // ← تحقق الأول
    return res.status(400).json({ error: "email, token, and type are required" });
  }

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post("/resend-otp", async (req, res) => {
  const { email, type } = req.body; // type

  const { error } = await supabase.auth.resend({
    type: type || "signup", 
    email,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "تم إرسال الكود بنجاح" });
});


router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "yourapp://reset-password",
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "تم إرسال رابط إعادة تعيين كلمة المرور" });
});

export default router;
