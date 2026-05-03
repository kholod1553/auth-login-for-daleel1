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
  const { data, error } = await supabase.f
