import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";
import { getVoteSummary } from "../lib/serviceEngagement.js";

const router = express.Router();

const normalizeVoteType = (value) => {
  if (value === 1 || value === "1") return "up";
  if (value === -1 || value === "-1") return "down";

  const normalized = String(value || "").toLowerCase().trim();

  if (["up", "upvote"].includes(normalized)) return "up";
  if (["down", "downvote"].includes(normalized)) return "down";

  return null;
};

const buildVoteResponse = async ({ serviceId, userId, action, voteType }) => {
  const summary = await getVoteSummary(serviceId, userId);

  return {
    success: true,
    action,
    vote_type: voteType,
    ...summary,
  };
};

// POST /votes/:serviceId - add, change, or remove a vote
router.post("/:serviceId", requireAuth, async (req, res) => {
  const serviceId = String(req.params.serviceId || "").trim();
  const vote_type = normalizeVoteType(
    req.body?.vote_type ?? req.body?.vote ?? req.body?.type,
  );
  const user_id = req.user.id;

  if (!serviceId) {
    return res.status(400).json({ error: "serviceId is required" });
  }

  if (!vote_type) {
    return res.status(400).json({ error: "vote_type must be up or down" });
  }

  const { data: existing, error: existingError } = await req.supabase
    .from("votes")
    .select("id, vote_type")
    .eq("service_id", serviceId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (existingError) return res.status(400).json({ error: existingError.message });

  if (existing) {
    if (existing.vote_type === vote_type) {
      const { error } = await req.supabase.from("votes").delete().eq("id", existing.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json(
        await buildVoteResponse({
          serviceId,
          userId: user_id,
          action: "removed",
          voteType: null,
        }),
      );
    } else {
      const { error } = await req.supabase
        .from("votes")
        .update({ vote_type })
        .eq("id", existing.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json(
        await buildVoteResponse({
          serviceId,
          userId: user_id,
          action: "changed",
          voteType: vote_type,
        }),
      );
    }
  }

  const { error } = await req.supabase
    .from("votes")
    .insert([{ service_id: serviceId, user_id, vote_type }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(
    await buildVoteResponse({
      serviceId,
      userId: user_id,
      action: "added",
      voteType: vote_type,
    }),
  );
});

// GET /votes/:serviceId - get vote totals for a service
router.get("/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;
    res.json(await getVoteSummary(serviceId));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /votes/:serviceId/my-vote - get current user's vote
router.get("/:serviceId/my-vote", requireAuth, async (req, res) => {
  const { serviceId } = req.params;
  try {
    const summary = await getVoteSummary(serviceId, req.user.id);
    res.json({ vote_type: summary.user_vote, ...summary });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
