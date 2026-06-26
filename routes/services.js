import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";
import { FALLBACK_SERVICES } from "../data/fallbackData.js";

const router = express.Router();
const normalizeService = (service) => ({
  ...service,
  title: service.title ?? service.name ?? null,
});
const toWritePayload = (body) => {
  const payload = {};
  if (body.name !== undefined || body.title !== undefined) {
    payload.name = body.name ?? body.title;
  }
  if (body.description !== undefined) payload.description = body.description;
  if (body.price !== undefined) payload.price = body.price;
  if (body.image_url !== undefined) payload.image_url = body.image_url;
  if (body.category_id !== undefined) payload.category_id = body.category_id;
  if (body.category_name !== undefined) payload.category_name = body.category_name;
  if (body.service_id !== undefined) payload.service_id = body.service_id;
  if (body.price_details !== undefined) payload.price_details = body.price_details;
  if (body.duration !== undefined) payload.duration = body.duration;
  if (body.available_times !== undefined) payload.available_times = body.available_times;
  if (body.fees !== undefined) payload.fees = body.fees;
  payload.is_public = false;
  payload.status = "pending";
  return payload;
};
const formatWriteError = (error) => {
  if (error?.message?.includes("row-level security policy")) {
    return {
      status: 403,
      body: { error: "Supabase RLS is blocking writes to services." },
    };
  }
  return {
    status: 400,
    body: { error: error?.message ?? "Unknown error" },
  };
};
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("services").select("*").eq("is_public", true);
  if (error || !data?.length) return res.json(FALLBACK_SERVICES);
  res.json(data.map(normalizeService));
});
router.get("/my-services", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from("services").select("*");
  if (error) {
    const f = formatWriteError(error);
    return res.status(f.status).json(f.body);
  }
  res.json((data || []).map(normalizeService));
});
router.get("/pending", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("services").select("*").eq("status", "pending");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data.map(normalizeService));
});
router.get("/popular", async (req, res) => {
  const { data, error } = await supabase.from("services").select("*").eq("is_public", true).limit(10);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data.map(normalizeService));
});
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Search query is required" });
  const { data, error } = await supabase
    .from("services").select("*").eq("is_public", true)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  if (error) return res.status(400).json({ error: error.message });
  if (!data?.length) return res.status(404).json({ error: "لا توجد نتائج" });
  res.json(data.map(normalizeService));
});
router.post("/", requireAuth, async (req, res) => {
  const payload = toWritePayload(req.body);
  payload.user_id = req.user.id;
  if (!payload.name || payload.price === undefined || payload.price === null) {
    return res.status(400).json({ error: "Name/title and price are required" });
  }
  const { data, error } = await supabase.from("services").insert([payload]).select().maybeSingle();
  if (error) {
    const f = formatWriteError(error);
    return res.status(f.status).json(f.body);
  }
  res.status(201).json(normalizeService(data));
});
router.put("/:id/approve", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("services").update({ is_public: true, status: "approved" })
    .eq("id", id).select().maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Service not found" });
  res.json({ message: "Service approved", service: data });
});
router.put("/:id/reject", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("services").update({ is_public: false, status: "rejected" })
    .eq("id", id).select().maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Service not found" });
  res.json({ message: "Service rejected", service: data });
});
router.get("/:id/steps", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("service_steps")
    .select("*")
    .eq("service_id", id)
    .order("step_number", { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post("/:id/steps", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { step_number, title, description } = req.body;
  if (!step_number || !title) {
    return res.status(400).json({ error: "step_number و title مطلوبين" });
  }
  const { data, error } = await supabase
    .from("service_steps")
    .insert([{ service_id: id, step_number, title, description }])
    .select()
    .maybeSingle();
  if (error) {
    const f = formatWriteError(error);
    return res.status(f.status).json(f.body);
  }
  res.status(201).json(data);
});
router.put("/:id/steps/:stepId", requireAuth, async (req, res) => {
  const { stepId } = req.params;
  const { step_number, title, description } = req.body;
  const updates = {};
  if (step_number !== undefined) updates.step_number = step_number;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "At least one field is required for update" });
  }
  const { data, error } = await supabase
    .from("service_steps")
    .update(updates)
    .eq("id", stepId)
    .select()
    .maybeSingle();
  if (error) {
    const f = formatWriteError(error);
    return res.status(f.status).json(f.body);
  }
  if (!data) return res.status(404).json({ error: "Step not found" });
  res.json(data);
});
router.delete("/:id/steps/:stepId", requireAuth, async (req, res) => {
  const { stepId } = req.params;
  const { data, error } = await supabase
    .from("service_steps")
    .delete()
    .eq("id", stepId)
    .select("id")
    .maybeSingle();
  if (error) {
    const f = formatWriteError(error);
    return res.status(f.status).json(f.body);
  }
  if (!data) return res.status(404).json({ error: "Step not found" });
  res.json({ message: "تم حذف الخطوة بنجاح", deletedId: data.id });
});
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = toWritePayload(req.body);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "At least one field is required for update" });
  }
  const { data, error } = await supabase
    .from("services").update(updates).eq("id", id).select().maybeSingle();
  if (error) {
    const f = formatWriteError(error);
    return res.status(f.status).json(f.body);
  }
  if (!data) return res.status(404).json({ error: "Service not found" });
  res.json({ message: "Service updated successfully", updated: normalizeService(data) });
});
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("services").delete().eq("id", id).select("id").maybeSingle();
  if (error) {
    const f = formatWriteError(error);
    return res.status(f.status).json(f.body);
  }
  if (!data) return res.status(404).json({ error: "Service not found" });
  res.json({ message: "Service deleted successfully", deletedId: data.id });
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("services").select("*").eq("id", id).eq("is_public", true).maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Service not found" });

  const { data: stepsData } = await supabase
    .from("service_steps")
    .select("*")
    .eq("service_id", id)
    .order("step_number", { ascending: true });

  const { data: ratingsData } = await supabase
    .from("comments")
    .select("rating")
    .eq("service_id", id)
    .not("rating", "is", null);

  const avgRating = ratingsData?.length
    ? parseFloat((ratingsData.reduce((sum, c) => sum + c.rating, 0) / ratingsData.length).toFixed(1))
    : 0;

  res.json({
    ...normalizeService(data),
    steps: stepsData || [],
    rating: avgRating,
    rating_count: ratingsData?.length ?? 0,
  });
});

export default router;
