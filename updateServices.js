const { data: existing } = await supabaseAdmin
  .from("services")
  .select("*")
  .eq("service_id", service.id)
  .maybeSingle();

const row = {
  category_id: category.id,
  category_name: category.name,
  service_id: service.id,
  name: existing?.name ?? service.name,

  data: service,

  description: existing?.description ?? service.description ?? null,

  price: existing?.price ?? feesValue,

  fees: existing?.fees ?? feesValue,

  price_details: existing?.price_details ?? priceDetails,

  duration: existing?.duration ?? duration,

  available_times: existing?.available_times ?? availableTimes,

  submission_method:
    existing?.submission_method ?? submissionMethod,

  is_online:
    existing?.is_online ?? service.is_online ?? false,

  is_public: existing?.is_public ?? true,

  status: existing?.status ?? "approved",
};

const { error } = await supabaseAdmin
  .from("services")
  .upsert(row, {
    onConflict: "service_id",
  });
