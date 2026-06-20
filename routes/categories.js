import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";
import { FALLBACK_CATEGORIES } from "../data/fallbackData.js";
const router = express.Router();

// GET /categories - جلب كل التصنيفات
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("categories").select("*");
  if (error || !data?.length) {
    return res.json(FALLBACK_CATEGORIES);
  }
  res.json(data);
});

// GET /categories/:id/services - جلب خدمات تصنيف معين
router.get("/:id/services", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("category_id", id);
  if (error) return res.status(400).json({ error: error.message });
  if (!data?.length) {
    return res.status(404).json({ error: "لا توجد خدمات لهذه الفئة" });
  }
  res.json(data);
});

// GET /categories/full - جلب التصنيفات + الخدمات + الخطوات في طلب واحد (Nested)
router.get("/full", async (req, res) => {
  try {
    const { data: categoriesData, error: catError } = await supabase
      .from("categories")
      .select("*");
    if (catError) return res.status(400).json({ error: catError.message });

    const result = await Promise.all(
      (categoriesData || []).map(async (category) => {
        const { data: servicesData, error: servError } = await supabase
          .from("services")
          .select("*")
          .eq("category_id", category.id)
          .eq("is_public", true);
        if (servError) throw servError;

        const servicesWithSteps = await Promise.all(
          (servicesData || []).map(async (service) => {
            const { data: stepsData, error: stepsError } = await supabase
              .from("service_steps")
              .select("*")
              .eq("service_id", service.id)
              .order("step_number", { ascending: true });
            if (stepsError) throw stepsError;

            return {
              ...service,
              title: service.title ?? service.name ?? null,
              steps: stepsData || [],
            };
          })
        );

        return {
          ...category,
          services: servicesWithSteps,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "حدث خطأ غير متوقع" });
  }
});

// POST /categories - إنشاء تصنيف جديد (لازم تسجيل دخول)
router.post("/", requireAuth, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name مطلوب" });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name, description }])
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /categories/:id - تعديل تصنيف (لازم تسجيل دخول)
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const { data, error } = await supabase
    .from("categories")
    .update({ name, description })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Category not found" });
  res.json(data);
});

// DELETE /categories/:id - حذف تصنيف (لازم تسجيل دخول)
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "تم حذف التصنيف بنجاح" });
});

export default router;
