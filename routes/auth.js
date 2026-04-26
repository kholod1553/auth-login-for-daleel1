import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
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
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});
router.post("/logout", requireAuth, async (req, res) => {
  const { error } = await supabase.auth.admin.signOut();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "تم تسجيل الخروج بنجاح" });
});
export default router;
