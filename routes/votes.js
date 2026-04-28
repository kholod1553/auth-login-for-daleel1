import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /votes/:serviceId
router.post("/:serviceId", requireAuth, async (req, res) => {
  const { serviceId } = req.params;
  const { vote_type } = req.body;

  // validation
  if (!vote_type || !["up", "down"].includes(vote_type)) {
    return res.status(400).json({ error: "vote_type لازم يكون up أو down" });
  }

  const { data, error } = await supabase.rpc("handle_vote", {
    p_service_id: serviceId,
    p_vote_type: vote_type,
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true, data });
});

// GET /votes/:serviceId
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

export default router;
