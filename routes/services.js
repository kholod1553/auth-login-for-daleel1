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

  if (body.description !== undefined) {
    payload.description = body.description;
  }

  if (body.price !== undefined) {
    payload.price = body.price;
  }

  if (body.image_url !== undefined) {
    payload.image_url = body.image_url;
  }

  return payload;
};

const formatWriteError = (error) => {
  if (error?.message?.includes("row-level security policy")) {
    return {
      status: 403,
      body: {
        error:
          "Supabase RLS is blocking writes to services. Apply the SQL in supabase/setup.sql to enable authenticated CRUD.",
      },
    };
  }

  return {
    status: 400,
    body: { error: error?.message ?? "Unknown error" },
  };
};

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("services").select("*");

  if (error || !data?.length) {
    return res.json(FALLBACK_SERVICES);
  }

  res.json(data.map(normalizeService));
});

router.get("/my-services", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from("services").select("*");

  if (error) {
    const formatted = formatWriteError(error);
    return res.status(formatted.status).json(formatted.body);
  }

  res.json((data || []).map(normalizeService));
});

router.post("/", requireAuth, async (req, res) => {
  const payload = toWritePayload(req.body);

  if (!payload.name || payload.price === undefined || payload.price === null) {
    return res
      .status(400)
      .json({ error: "Name/title and price are required" });
  }

  const { data, error } = await req.supabase
    .from("services")
    .insert([payload])
    .select()
    .maybeSingle();

  if (error) {
    const formatted = formatWriteError(error);
    return res.status(formatted.status).json(formatted.body);
  }

  res.status(201).json(normalizeService(data));
});

router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = toWritePayload(req.body);

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field is required for update" });
  }

  const { data, error } = await req.supabase
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    const formatted = formatWriteError(error);
    return res.status(formatted.status).json(formatted.body);
  }

  if (!data) {
    return res.status(404).json({ error: "Service not found" });
  }

  res.json({
    message: "Service updated successfully",
    updated: normalizeService(data),
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from("services")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    const formatted = formatWriteError(error);
    return res.status(formatted.status).json(formatted.body);
  }

  if (!data) {
    return res.status(404).json({ error: "Service not found" });
  }

  res.json({ message: "Service deleted successfully", deletedId: data.id });
});

export default router;
