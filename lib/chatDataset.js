import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.join(
  __dirname,
  "..",
  "data",
  "egypt_government_services.json",
);

const rawDataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return [value];
  if (typeof value === "object") {
    return Object.values(value)
      .flatMap((item) => toArray(item))
      .filter(Boolean);
  }
  return [String(value)];
};

const formatFees = (fees) => {
  if (!fees) return null;

  if (typeof fees.amount === "number") {
    return `${fees.amount} ${fees.currency || "EGP"}${fees.notes ? ` - ${fees.notes}` : ""}`;
  }

  if (typeof fees.min === "number" || typeof fees.max === "number") {
    return `${fees.min ?? 0} - ${fees.max ?? 0} ${fees.currency || "EGP"}${fees.notes ? ` - ${fees.notes}` : ""}`;
  }

  if (fees.application_fee) {
    return formatFees({
      ...fees.application_fee,
      notes: fees.notes || fees.application_fee.notes,
    });
  }

  return fees.notes || null;
};

const formatDuration = (duration) => {
  if (!duration) return null;

  if (duration.description) {
    return duration.description;
  }

  if (
    typeof duration.min_days === "number" ||
    typeof duration.max_days === "number"
  ) {
    return `${duration.min_days ?? 0} - ${duration.max_days ?? 0} days`;
  }

  return null;
};

const buildServiceEntries = () =>
  (rawDataset.categories || []).flatMap((category) =>
    (category.services || []).map((service) => ({
      id: service.id || `${category.id}-${service.name}`,
      type: "service",
      category: category.name,
      categoryEn: category.name_en || null,
      authority: category.authority?.name || null,
      authorityWebsite: category.authority?.website || null,
      service: service.name,
      serviceEn: service.name_en || null,
      description: service.description || null,
      documents: toArray(service.required_documents),
      steps: toArray(service.steps),
      channels: toArray(service.submission_method),
      fees: formatFees(service.fees),
      duration: formatDuration(service.duration),
      online: Boolean(service.is_online),
      benefits: toArray(service.benefits),
      eligibility: toArray(service.eligibility),
      programs: Array.isArray(service.programs) ? service.programs : [],
      incentives: toArray(service.incentives),
      website: service.website || category.authority?.website || null,
      searchText: [
        service.id,
        service.name,
        service.name_en,
        service.description,
        category.name,
        category.name_en,
        category.authority?.name,
        ...(toArray(service.required_documents)),
        ...(toArray(service.steps)),
        ...(toArray(service.submission_method)),
        ...(toArray(service.benefits)),
        ...(toArray(service.eligibility)),
        ...((Array.isArray(service.programs) ? service.programs : []).map((program) => program.name)),
        ...((Array.isArray(service.programs) ? service.programs : []).map((program) => program.target)),
        ...(toArray(service.incentives)),
        service.website,
      ]
        .filter(Boolean)
        .join(" "),
    })),
  );

const buildContactEntries = () => [
  ...(rawDataset.emergency_numbers || []).map((item) => ({
    id: `emergency-${item.number}`,
    type: "contact",
    label: item.service,
    labelEn: item.service_en || null,
    number: item.number,
    kind: "emergency",
    searchText: [item.service, item.service_en, item.number]
      .filter(Boolean)
      .join(" "),
  })),
  ...(rawDataset.useful_contacts || []).map((item) => ({
    id: `contact-${item.hotline || item.entity}`,
    type: "contact",
    label: item.entity,
    labelEn: item.entity_en || null,
    number: item.hotline || null,
    website: item.website || null,
    kind: "useful_contact",
    searchText: [item.entity, item.entity_en, item.hotline, item.website]
      .filter(Boolean)
      .join(" "),
  })),
];

const buildPlatformEntries = () =>
  (rawDataset.main_platforms || []).map((platform) => ({
    id: `platform-${platform.id}`,
    type: "platform",
    label: platform.name,
    labelEn: platform.name_en || null,
    website: platform.website || null,
    hotline: platform.hotline || null,
    email: platform.email || null,
    searchText: [
      platform.id,
      platform.name,
      platform.name_en,
      platform.website,
      platform.hotline,
      platform.email,
    ]
      .filter(Boolean)
      .join(" "),
  }));

const buildNoteEntries = () =>
  (rawDataset.important_notes || []).map((note, index) => ({
    id: `note-${index + 1}`,
    type: "note",
    text: note,
    searchText: note,
  }));

export const CHAT_DATASET = {
  metadata: rawDataset.metadata || {},
  services: buildServiceEntries(),
  contacts: buildContactEntries(),
  platforms: buildPlatformEntries(),
  notes: buildNoteEntries(),
};

export const CHAT_ENTRIES = [
  ...CHAT_DATASET.services,
  ...CHAT_DATASET.contacts,
  ...CHAT_DATASET.platforms,
  ...CHAT_DATASET.notes,
];
