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

export default router;
