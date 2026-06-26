import fs from "fs";
import { supabaseAdmin } from "./supabaseClient.js";

if (!supabaseAdmin) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");
}

const data = JSON.parse(
  fs.readFileSync("./data/egypt_government_services.json", "utf8")
);

async function updateServices() {
  let updated = 0;
  let failed = 0;

  for (const category of data.categories) {
    console.log(`\n📁 ${category.name}`);

    for (const service of category.services) {

      // تجهيز الرسوم
      let feesValue = null;
      let priceDetails = null;

      if (service.fees) {
        feesValue = service.fees.amount ?? service.fees.min ?? null;

        if (service.fees.amount != null) {
          priceDetails =
            `${service.fees.amount} ${service.fees.currency ?? ""}` +
            (service.fees.notes ? ` - ${service.fees.notes}` : "");
        } else if (
          service.fees.min != null &&
          service.fees.max != null
        ) {
          priceDetails =
            `${service.fees.min} - ${service.fees.max} ${service.fees.currency ?? ""}` +
            (service.fees.notes ? ` - ${service.fees.notes}` : "");
        }
      }

      // المدة
      const duration =
        service.duration?.description ?? null;

      // مواعيد العمل
      const availableTimes = Array.isArray(service.available_times)
        ? service.available_times.join(" - ")
        : service.available_times ?? null;

      // طريقة التقديم
      const submissionMethod = Array.isArray(service.submission_method)
        ? service.submission_method.join(" - ")
        : null;

      const updateData = {
        description: service.description ?? null,
        fees: feesValue,
        price_details: priceDetails,
        duration,
        available_times: availableTimes,
        submission_method: submissionMethod,
        is_online: service.is_online ?? false
      };

      const { error } = await supabaseAdmin
        .from("services")
        .update(updateData)
        .eq("service_id", service.id);

      if (error) {
        failed++;
        console.log(`❌ ${service.id}`);
        console.log(error.message);
      } else {
        updated++;
        console.log(`✅ ${service.id}`);
      }
    }
  }

  console.log("\n========================");
  console.log(`✅ Updated : ${updated}`);
  console.log(`❌ Failed  : ${failed}`);
  console.log("========================");
}

updateServices();
