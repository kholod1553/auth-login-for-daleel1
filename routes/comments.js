import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /comments/:serviceId - جلب كومنتات خدمة
router.get("/:serviceId", async (req, res) => {
    try {
        const { serviceId } = req.params;
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

// POST /comments/:serviceId - إضافة كومنت
router.post("/:serviceId", requireAuth, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { content, rating } = req.body;

        if (!content) return res.status(400).json({ error: "content مطلوب" });
        if (rating && (rating < 1 || rating > 5))
            return res.status(400).json({ error: "rating لازم يكون بين 1 و 5" });

        const { data, error } = await supabase
            .from("comments")
            .insert([{
                service_id: serviceId,
                user_id: req.user.id,
               user_name: req.user.user_metadata?.name ?? req.user.name ?? req.user.email,
                content,
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

// DELETE /comments/by-service/:serviceId - حذف كل كومنتات خدمة
router.delete("/by-service/:serviceId", requireAuth, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { data, error } = await supabase
            .from("comments")
            .delete()
            .eq("service_id", serviceId)
            .eq("user_id", req.user.id)
            .select("id");
            
        if (error) return res.status(400).json({ error: error.message });
        if (!data.length) return res.status(404).json({ error: "No comments found" });
        
        res.json({ message: `تم حذف ${data.length} كومنت` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /comments/:serviceId/rating - متوسط الـ rating
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
