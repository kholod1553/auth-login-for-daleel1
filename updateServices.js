
const fs = require('fs');
const path = require('path');
const DEFAULT_JSON_PATH = './data/NEW_egypt_government_services.json';
function extractPrice(fees) {
  if (!fees) return null;
  if (typeof fees.amount === 'number') return fees.amount;
  if (typeof fees.min === 'number') return fees.min;
  if (typeof fees.max === 'number') return fees.max;
  return null;
}

function extractPriceDetails(fees) {
  if (!fees) return null;
  const parts = [];
  if (fees.notes) parts.push(fees.notes);
  if (fees.options && Array.isArray(fees.options)) {
    fees.options.forEach(opt => {
      parts.push(`${opt.type}: ${opt.amount} ${opt.currency || 'EGP'}`);
    });
  }
  return parts.length > 0 ? parts.join(' | ') : null;
}


function extractDuration(duration) {
  if (!duration) return null;
  if (duration.description) return duration.description;
  if (duration.min_days !== undefined && duration.max_days !== undefined) {
    if (duration.min_days === duration.max_days) {
      return duration.min_days === 0 ? 'فوري' : `${duration.min_days} يوم`;
    }
    return `من ${duration.min_days} إلى ${duration.max_days} يوم`;
  }
  return null;
}

/**
 * Extract available times / timing
 */
function extractAvailableTimes(service) {
  if (service.timing) return service.timing;
  if (service.duration && service.duration.description) {
    return service.duration.description;
  }
  return null;
}

/**
 * Extract submission method as text
 */
function extractSubmissionMethod(service) {
  if (!service.submission_method) return null;
  if (Array.isArray(service.submission_method)) {
    return service.submission_method.join(' | ');
  }
  return String(service.submission_method);
}

/**
 * Build data JSONB object for the service
 */
function buildDataJson(service, category) {
  const data = {
    id: service.id,
    name_en: service.name_en || null,
    description_en: service.description_en || null,
    fees: service.fees || null,
    duration: service.duration || null,
    required_documents: service.required_documents || null,
    submission_method: service.submission_method || null,
    is_online: service.is_online ?? null,
    website: service.website || null,
    authority_sub: service.authority_sub || null,
    timing: service.timing || null,
    age_requirement: service.age_requirement || null,
    validity: service.validity || null,
    notes: service.notes || null,
    coverage_areas: service.coverage_areas || null,
    target_groups: service.target_groups || null,
    return_types: service.return_types || null,
    types: service.types || null,
    eligibility: service.eligibility || null,
    initiatives: service.initiatives || null,
    requirements: service.requirements || null,
    unit_types: service.unit_types || null,
    payment_methods: service.payment_methods || null,
    inquiry_methods: service.inquiry_methods || null,
    benefits: service.benefits || null,
    hotlines: service.hotlines || null,
    emergency_hotline: service.emergency_hotline || null,
    // Category authority info
    category_authority: category.authority || null,
  };
  // Remove null values to keep JSONB clean
  Object.keys(data).forEach(key => {
    if (data[key] === null || data[key] === undefined) {
      delete data[key];
    }
  });
  return data;
}

/**
 * Build service object for upsert
 */
function buildServiceRow(service, category) {
  const fees = service.fees || null;
  const price = extractPrice(fees);
  const priceDetails = extractPriceDetails(fees);
  const duration = extractDuration(service.duration);
  const availableTimes = extractAvailableTimes(service);
  const submissionMethod = extractSubmissionMethod(service);
  const dataJson = buildDataJson(service, category);

  return {
    category_id: category.id,
    category_name: category.name,
    service_id: service.id,
    name: service.name,
    description: service.description || null,
    price: price,
    data: dataJson,
    is_public: true,
    status: 'approved',
    price_details: priceDetails,
    duration: duration,
    available_times: availableTimes,
    fees: price,
    submission_method: submissionMethod,
    is_online: service.is_online ?? null,
    user_id: null,
  };
}

/**
 * Build service_details rows from required_documents
 */
function buildServiceDetails(service) {
  const docs = service.required_documents;
  if (!docs || !Array.isArray(docs) || docs.length === 0) return [];

  return docs.map((doc, index) => {
    // Handle both string documents and object documents
    if (typeof doc === 'string') {
      return {
        service_id: service.id,
        document_name: doc,
        document_type: 'required',
        sort_order: index + 1,
        is_required: true,
      };
    }
    // Handle object format like { category: "...", items: [...] }
    if (typeof doc === 'object' && doc !== null) {
      if (doc.category) {
        return {
          service_id: service.id,
          document_name: doc.category,
          document_type: 'category',
          sort_order: index + 1,
          is_required: true,
          extra_data: { items: doc.items || [] },
        };
      }
      return {
        service_id: service.id,
        document_name: doc.name || JSON.stringify(doc),
        document_type: 'required',
        sort_order: index + 1,
        is_required: true,
        extra_data: doc,
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Build service_steps rows
 * Since JSON doesn't have explicit steps, we generate them from submission_method
 */
function buildServiceSteps(service) {
  const steps = [];
  const methods = service.submission_method;

  if (methods && Array.isArray(methods) && methods.length > 0) {
    methods.forEach((method, index) => {
      steps.push({
        service_id: service.id,
        step_number: index + 1,
        title: method,
        description: null,
        is_online: service.is_online ?? false,
      });
    });
  }

  // If there are required documents, add a step for document preparation
  if (service.required_documents && service.required_documents.length > 0) {
    steps.push({
      service_id: service.id,
      step_number: steps.length + 1,
      title: 'تجهيز المستندات المطلوبة',
      description: service.required_documents
        .map(d => typeof d === 'string' ? d : (d.category || JSON.stringify(d)))
        .join('، '),
      is_online: false,
    });
  }

  // Add a step for fees if applicable
  if (service.fees) {
    const feeText = extractPriceDetails(service.fees) || 'رسوم حسب الخدمة';
    steps.push({
      service_id: service.id,
      step_number: steps.length + 1,
      title: 'سداد الرسوم',
      description: feeText,
      is_online: service.is_online ?? false,
    });
  }

  // Add duration step
  if (service.duration) {
    steps.push({
      service_id: service.id,
      step_number: steps.length + 1,
      title: 'مدة إنجاز الخدمة',
      description: extractDuration(service.duration),
      is_online: true,
    });
  }

  return steps;
}

// ─── Main Processing ─────────────────────────────────────────────

async function processServices(supabase, jsonPath) {
  console.log(`📖 Reading JSON from: ${jsonPath}`);

  // Read and parse JSON
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const jsonData = JSON.parse(raw);

  if (!jsonData.categories || !Array.isArray(jsonData.categories)) {
    throw new Error('Invalid JSON format: expected "categories" array');
  }

  // Flatten all services from categories
  const allServices = [];
  const seenServiceIds = new Set();

  for (const category of jsonData.categories) {
    if (!category.services || !Array.isArray(category.services)) continue;

    for (const service of category.services) {
      // Skip duplicates
      if (seenServiceIds.has(service.id)) {
        console.warn(`⚠️ Duplicate service_id skipped: ${service.id}`);
        continue;
      }
      seenServiceIds.add(service.id);

      allServices.push({
        service,
        category,
      });
    }
  }

  console.log(`📊 Found ${allServices.length} unique services across ${jsonData.categories.length} categories`);

  // Statistics
  const stats = {
    services: { inserted: 0, updated: 0, skipped: 0, errors: 0 },
    serviceDetails: { inserted: 0, updated: 0, skipped: 0, errors: 0 },
    serviceSteps: { inserted: 0, updated: 0, skipped: 0, errors: 0 },
  };

  // ─── Upsert Services ───────────────────────────────────────
  console.log('\n🔄 Processing services...');

  for (const { service, category } of allServices) {
    const row = buildServiceRow(service, category);

    try {
      // Check if service exists
      const { data: existing, error: checkError } = await supabase
        .from('services')
        .select('id, service_id, name, description, price, data, duration, is_online, submission_method')
        .eq('service_id', service.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // UPDATE: Only fill NULL columns, don't overwrite existing data
        const updates = {};

        if (!existing.name && row.name) updates.name = row.name;
        if (!existing.description && row.description) updates.description = row.description;
        if (existing.price === null && row.price !== null) updates.price = row.price;
        if (!existing.duration && row.duration) updates.duration = row.duration;
        if (existing.is_online === null && row.is_online !== null) updates.is_online = row.is_online;
        if (!existing.submission_method && row.submission_method) updates.submission_method = row.submission_method;

        // Merge data JSONB: keep existing, add missing fields
        const existingData = existing.data || {};
        const newData = { ...row.data };
        Object.keys(newData).forEach(key => {
          if (existingData[key] === undefined || existingData[key] === null) {
            existingData[key] = newData[key];
          }
        });
        updates.data = existingData;

        // Always update these tracking fields
        updates.category_id = row.category_id;
        updates.category_name = row.category_name;
        updates.status = 'approved';
        updates.is_public = true;

        if (Object.keys(updates).length > 2) { // More than just category_id + category_name
          const { error: updateError } = await supabase
            .from('services')
            .update(updates)
            .eq('service_id', service.id);

          if (updateError) throw updateError;
          stats.services.updated++;
          console.log(`  ✏️ Updated: ${service.id} (${service.name})`);
        } else {
          stats.services.skipped++;
          console.log(`  ⏭️ Skipped (no empty fields): ${service.id}`);
        }
      } else {
        // INSERT new service
        const { error: insertError } = await supabase
          .from('services')
          .insert(row);

        if (insertError) throw insertError;
        stats.services.inserted++;
        console.log(`  ➕ Inserted: ${service.id} (${service.name})`);
      }
    } catch (err) {
      stats.services.errors++;
      console.error(`  ❌ Error processing service ${service.id}: ${err.message}`);
    }
  }

  // ─── Upsert Service Details ──────────────────────────────────
  console.log('\n🔄 Processing service_details...');

  for (const { service } of allServices) {
    const details = buildServiceDetails(service);
    if (details.length === 0) {
      stats.serviceDetails.skipped++;
      continue;
    }

    try {
      // Check existing details for this service
      const { data: existingDetails, error: checkError } = await supabase
        .from('service_details')
        .select('id, document_name')
        .eq('service_id', service.id);

      if (checkError) throw checkError;

      const existingDocs = new Set((existingDetails || []).map(d => d.document_name));

      for (const detail of details) {
        if (existingDocs.has(detail.document_name)) {
          stats.serviceDetails.skipped++;
          continue;
        }

        const { error: insertError } = await supabase
          .from('service_details')
          .insert(detail);

        if (insertError) throw insertError;
        stats.serviceDetails.inserted++;
      }
    } catch (err) {
      stats.serviceDetails.errors++;
      console.error(`  ❌ Error processing details for ${service.id}: ${err.message}`);
    }
  }

  // ─── Upsert Service Steps ────────────────────────────────────
  console.log('\n🔄 Processing service_steps...');

  for (const { service } of allServices) {
    const steps = buildServiceSteps(service);
    if (steps.length === 0) {
      stats.serviceSteps.skipped++;
      continue;
    }

    try {
      // Check existing steps for this service
      const { data: existingSteps, error: checkError } = await supabase
        .from('service_steps')
        .select('id, step_number, title')
        .eq('service_id', service.id);

      if (checkError) throw checkError;

      const existingStepKeys = new Set(
        (existingSteps || []).map(s => `${s.step_number}:${s.title}`)
      );

      for (const step of steps) {
        const stepKey = `${step.step_number}:${step.title}`;
        if (existingStepKeys.has(stepKey)) {
          stats.serviceSteps.skipped++;
          continue;
        }

        const { error: insertError } = await supabase
          .from('service_steps')
          .insert(step);

        if (insertError) throw insertError;
        stats.serviceSteps.inserted++;
      }
    } catch (err) {
      stats.serviceSteps.errors++;
      console.error(`  ❌ Error processing steps for ${service.id}: ${err.message}`);
    }
  }

  return stats;
}

// ─── CLI Entry Point ─────────────────────────────────────────────

async function main() {
  const jsonPath = process.argv[2] || DEFAULT_JSON_PATH;

  // Resolve path relative to script
  const resolvedPath = path.resolve(jsonPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`);
    console.error('Usage: node updateServices.js [path/to/NEW_egypt_government_services.json]');
    process.exit(1);
  }

  // Import Supabase client (assumes @supabase/supabase-js is installed)
  let supabase;
  try {
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.');
      process.exit(1);
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client. Make sure @supabase/supabase-js is installed.');
    console.error(err.message);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════');
  console.log('  EGYPT GOVERNMENT SERVICES - UPSERT');
  console.log('═══════════════════════════════════════════');
  console.log(`JSON File: ${resolvedPath}`);
  console.log(`Supabase:  ${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log('');

  const startTime = Date.now();

  try {
    const stats = await processServices(supabase, resolvedPath);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  FINAL REPORT');
    console.log('═══════════════════════════════════════════');
    console.log(`Total time: ${elapsed}s`);
    console.log('');
    console.log('Services:');
    console.log(`  • Inserted: ${stats.services.inserted}`);
    console.log(`  • Updated:  ${stats.services.updated}`);
    console.log(`  • Skipped:  ${stats.services.skipped}`);
    console.log(`  • Errors:   ${stats.services.errors}`);
    console.log('');
    console.log('Service Details:');
    console.log(`  • Inserted: ${stats.serviceDetails.inserted}`);
    console.log(`  • Skipped:  ${stats.serviceDetails.skipped}`);
    console.log(`  • Errors:   ${stats.serviceDetails.errors}`);
    console.log('');
    console.log('Service Steps:');
    console.log(`  • Inserted: ${stats.serviceSteps.inserted}`);
    console.log(`  • Skipped:  ${stats.serviceSteps.skipped}`);
    console.log(`  • Errors:   ${stats.serviceSteps.errors}`);
    console.log('');
    console.log('Done! ✓');

    // Exit with error code if there were errors
    const totalErrors = stats.services.errors + stats.serviceDetails.errors + stats.serviceSteps.errors;
    process.exit(totalErrors > 0 ? 1 : 0);

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  }
}

main();
