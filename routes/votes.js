import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /votes/:serviceId - إضافة أو تغيير vote
router.post("/:serviceId", requireAuth, async (req, res) => {
  const { serviceId } = req.params;
  const { vote_type } = req.body;
  const user_id = req.user.id;

  if (!vote_type || !["up", "down"].includes(vote_type)) {
    return res.status(400).json({ error: "vote_type لازم يكون up أو down" });
  }

  // شوف لو اليوزر ده سبق عمل vote على نفس الخدمة
  const { data: existing } = await supabase
    .from("votes")
    .select("id, vote_type")
    .eq("service_id", serviceId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (existing) {
    if (existing.vote_type === vote_type) {
      // نفس الـ vote → احذفه (toggle)
      await supabase.from("votes").delete().eq("id", existing.id);
      return res.json({ success: true, action: "removed", vote_type });
    } else {
      // vote مختلف → غيّره
      const { error } = await supabase
        .from("votes")
        .update({ vote_type })
        .eq("id", existing.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true, action: "changed", vote_type });
    }
  }

  // vote جديد
  const { error } = await supabase
    .from("votes")
    .insert([{ service_id: serviceId, user_id, vote_type }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, action: "added", vote_type });
});

// GET /votes/:serviceId - جلب votes الخدمة
router.get("/:serviceId", async (req, res) => {
  const { serviceId } = req.params;
  const { data, error } = await supabase
    .from("votes")
    .select("vote_type")
    .eq("service_id", serviceId);
  if (error) return res.status(400).json({ error: error.message });
  const upvotes = data.filter((v) => v.vote_type === "up").length;
  const downvotes = data.filter((v) => v.vote_type === "down").length;
  res.json({ upvotes, downvotes });
});

// GET /votes/:serviceId/my-vote - شوف vote اليوزر الحالي
router.get("/:serviceId/my-vote", requireAuth, async (req, res) => {
  const { serviceId } = req.params;
  const user_id = req.user.id;
  const { data, error } = await supabase
    .from("votes")
    .select("vote_type")
    .eq("service_id", serviceId)
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ vote_type: data?.vote_type ?? null });
});

export default router;
