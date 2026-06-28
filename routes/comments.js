import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /comments/:serviceId - list service comments
router.get("/:serviceId", async (req, res) => {
    try {
        const serviceId = String(req.params.serviceId || "").trim();
        if (!serviceId) return res.status(400).json({ error: "serviceId is required" });

        const { data, error } = await supabase
            .from("comments")
            .select("*")
            .eq("service_id", serviceId)
            .order("created_at", { ascending: false });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /comments/:serviceId - add a service comment
router.post("/:serviceId", requireAuth, async (req, res) => {
    try {
        const serviceId = String(req.params.serviceId || "").trim();
        const { content, rating } = req.body;
        const safeContent = String(content || "").trim();

        if (!serviceId) return res.status(400).json({ error: "serviceId is required" });
        if (!safeContent) return res.status(400).json({ error: "content is required" });
        if (rating && (rating < 1 || rating > 5))
            return res.status(400).json({ error: "rating must be between 1 and 5" });

        const { data, error } = await req.supabase
            .from("comments")
            .insert([{
                service_id: serviceId,
                user_id: req.user.id,
                user_name: req.user.user_metadata?.name ?? req.user.name ?? req.user.email,
                content: safeContent,
                rating: rating ?? null,
            }])
            .select()
            .maybeSingle();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /comments/by-service/:serviceId - delete current user's comments on a service
router.delete("/by-service/:serviceId", requireAuth, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { data, error } = await req.supabase
            .from("comments")
            .delete()
            .eq("service_id", serviceId)
            .eq("user_id", req.user.id)
            .select("id");
            
        if (error) return res.status(400).json({ error: error.message });
        if (!data.length) return res.status(404).json({ error: "No comments found" });
        
        res.json({ message: `Deleted ${data.length} comments` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /comments/:commentId - delete one comment owned by the current user
router.delete("/:commentId", requireAuth, async (req, res) => {
    try {
        const commentId = String(req.params.commentId || "").trim();
        if (!commentId) return res.status(400).json({ error: "commentId is required" });

        const { data, error } = await req.supabase
            .from("comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", req.user.id)
            .select("id")
            .maybeSingle();

        if (error) return res.status(400).json({ error: error.message });
        if (!data) return res.status(404).json({ error: "Comment not found" });

        res.json({ message: "Comment deleted successfully", deletedId: data.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /comments/:serviceId/rating - average service rating
router.get("/:serviceId/rating", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { data, error } = await supabase
            .from("comments")
            .select("rating")
            .eq("service_id", serviceId)
            .not("rating", "is", null);
        if (error) return res.status(400).json({ error: error.message });
        if (!data.length) return res.json({ average: 0, count: 0 });
        const avg = data.reduce((sum, c) => sum + c.rating, 0) / data.length;
        res.json({ average: parseFloat(avg.toFixed(1)), count: data.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
