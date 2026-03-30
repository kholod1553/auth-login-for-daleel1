import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, name, phone } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });

  if (error) return res.status(400).json(error);

  res.json(data);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json(error);

  res.json(data);
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
