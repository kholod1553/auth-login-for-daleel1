import { CHAT_DATASET, CHAT_ENTRIES } from "./chatDataset.js";

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;
const CONTACT_HINTS = [
  "رقم",
  "تليفون",
  "هاتف",
  "خط",
  "الخط",
  "ساخن",
  "طوارئ",
  "نجدة",
  "النجدة",
  "اسعاف",
  "مطافئ",
  "شرطة",
  "شكاوى",
  "شكوى",
];
const SERVICE_HINTS = [
  "بطاقه",
  "بطاقة",
  "رقم قومي",
  "شهاده",
  "شهادة",
  "جواز",
  "رخصه",
  "رخصة",
  "رخصتي",
  "تجديد",
  "اجدد",
  "منتهيه",
  "منتهية",
  "استخراج",
  "بدل",
  "فاقد",
];
const SEMANTIC_EQUIVALENTS = {
  تجديد: ["منتهيه", "منتهية", "اجدد", "جدد"],
  منتهيه: ["تجديد", "اجدد"],
  منتهية: ["تجديد", "اجدد"],
  فاقد: ["بدل", "تالف"],
  تالف: ["بدل", "فاقد"],
  بدل: ["فاقد", "تالف"],
  رخصه: ["رخصة", "مرور"],
  رخصة: ["رخصه", "مرور"],
  مرور: ["رخصه", "رخصة"],
  جواز: ["سفر"],
  سفر: ["جواز"],
  شهاده: ["شهادة", "ميلاد", "وفاه", "وفاة"],
  شهادة: ["شهاده", "ميلاد", "وفاه", "وفاة"],
  ميلاد: ["شهاده", "شهادة"],
  وفاه: ["شهاده", "شهادة"],
  وفاة: ["شهاده", "شهادة"],
  بطاقه: ["بطاقة", "رقم", "قومي"],
  بطاقة: ["بطاقه", "رقم", "قومي"],
  قومي: ["بطاقه", "بطاقة", "رقم"],
  تموين: ["بطاقه", "بطاقة", "دعم"],
};
const STOP_WORDS = new Set([
  "عايز",
  "اريد",
  "ابغى",
  "محتاج",
  "لو",
  "سمحت",
  "من",
  "على",
  "في",
  "عن",
  "ما",
  "ماذا",
  "ايه",
  "اي",
  "الى",
  "او",
]);
const DALEEL_PROFILE = {
  name: "دليل",
  englishName: "Daleel",
  tagline: "رفيقك الذكي في المعاملات والرحلات الحكومية.",
  mission:
    "منصة ومساعد ذكي للمواطن المصري لتبسيط الإجراءات الحكومية وتقليل المشاوير والوقت الضائع.",
  vision:
    "تقديم مرجع موثوق وموحد للإجراءات الحكومية والخدمية في مصر يعتمد على بيانات منظمة وتجارب واقعية.",
  positioning:
    "منصة مجتمعية تجمع بين الدليل الإجرائي المنظم والتحقق المجتمعي والذكاء الاصطناعي.",
  coverageSummary:
    "تغطي خدمات حكومية وخدمية متعددة عبر عشرات التصنيفات مع تركيز على الإجراءات الواقعية التي تحتاج زيارات فعلية.",
  whatWeDo: [
    "توفير معلومات الخدمات الحكومية بشكل واضح ومباشر.",
    "عرض المستندات المطلوبة وخطوات التنفيذ والجهة المسؤولة.",
    "مساعدة المستخدم على الوصول للجهات الحكومية بدقة.",
    "تجميع خبرات المجتمع لتبادل النصائح والتجارب العملية.",
  ],
  differentiators: [
    "محتوى قائم على تجارب مستخدمين حقيقية وليس وصفًا نظريًا فقط.",
    "نظام تحقق مجتمعي (تصويت/تقييم) لتحسين الموثوقية.",
    "تنظيم المعلومات في شكل قابل للبحث والتصفية بسهولة.",
    "دمج الخرائط لتوجيه المستخدم للجهة الصحيحة وتقليل إهدار الوقت.",
    "مساعد ذكي يبسّط الإجراءات ويشرحها بلغة واضحة.",
  ],
  valueProposition:
    "بدل الحيرة والتنقل بين مصادر غير واضحة، دليل يجمع لك المعلومات الحكومية المهمة في مكان واحد وبصياغة بسيطة.",
  support: {
    email: "daleel.support.csi@gmail.com",
    phone: "+201010434465",
    location: "مصر، الجيزة، مدينة السادس من أكتوبر",
    linkedin: "https://www.linkedin.com/company/daleel-eg-csi",
  },
  appHighlights: [
    "مساعد ذكي للإجابة الفورية عن الإجراءات والأوراق.",
    "عرض المستندات والخطوات والرسوم المتوقعة حسب الخدمة.",
    "محتوى مجتمعي لمشاركة التجارب وتحديثات الطريق.",
    "تجربة استخدام بسيطة وسريعة داخل التطبيق.",
  ],
};
const CHAT_BRAND_TONE = (process.env.CHAT_BRAND_TONE || "professional")
  .toLowerCase()
  .trim();
const TONE_INSTRUCTION_MAP = {
  professional:
    "Tone: professional, polished, service-oriented, and reassuring.",
  friendly: "Tone: friendly, warm, empathetic, and supportive.",
  concise: "Tone: concise, direct, and practical with minimal wording.",
};
const DALEEL_ABOUT_HINTS = [
  "الويبسايت",
  "الموقع",
  "site",
  "website",
  "about",
  "who are you",
  "مين انتم",
  "من انتم",
  "مين انتو",
  "انتوا مين",
  "مين انت",
  "من انت",
  "اسمكم",
  "بتعملوا ايه",
  "بتقدمو ايه",
  "نبذه",
  "تعريف",
  "عنكم",
];
const ABOUT_WITH_NAME_HINTS = [
  "مين",
  "من",
  "تعريف",
  "نبذه",
  "بتعملوا",
  "بتقدمو",
  "خدمه",
  "رسالتكم",
];
const GREETING_HINTS = [
  "اهلا",
  "اهلين",
  "مرحبا",
  "هاي",
  "هلا",
  "الو",
  "hi",
  "hello",
  "hey",
  "good morning",
  "good evening",
  "ازيك",
  "ازيك؟",
  "عامل ايه",
  "عامل اي",
  "كيف حالك",
  "السلام عليكم",
  "صباح الخير",
  "صباح الفل",
  "مساء الخير",
  "مساء الفل",
];
const THANKS_HINTS = [
  "شكرا",
  "شكراً",
  "متشكر",
  "تسلم",
  "تسلملي",
  "ميرسي",
  "thanks",
  "thank you",
];
const GOODBYE_HINTS = [
  "مع السلامه",
  "مع السلامة",
  "سلام",
  "اشوفك بعدين",
  "باي",
  "goodbye",
  "bye",
];
const HELP_HINTS = [
  "ساعدني",
  "مساعده",
  "مساعدة",
  "help",
  "مش عارف",
  "مش عارف اعمل ايه",
  "اعمل ايه",
  "ابدأ ازاي",
];
const OFF_TOPIC_HINTS = [
  "كوره",
  "كرة",
  "مباراه",
  "movie",
  "فيلم",
  "اغنيه",
  "طبخ",
  "برمجه",
  "code",
  "crypto",
  "بورصه",
  "weather",
  "طقس",
];
const CUSTOM_PERSON_RESPONSES = [
  {
    aliases: ["عبدالله"],
    answer: "عبدالله الجلنف",
  },
  {
    aliases: ["عماد"],
    answer: "عماد حرنكش",
  },
  {
    aliases: ["مصطفى", "سمعه"],
    answer: "صبي عبدالعزيز",
  },
  {
    aliases: ["عبدالعزيز", "عبعزيز"],
    answers: ["السبيشيال ون ☝", "عم دليل"],
  },
];
const RENEWAL_HINTS = ["تجديد", "اجدد", "جدد", "تجدد", "منتهيه", "منتهية"];
const FIRST_TIME_HINTS = ["اول مره", "لاول مره", "اول مرة", "لأول مرة", "first time"];
const CORRECTION_HINTS = ["لا", "مش", "مش دي", "مش ده", "قصدي", "اقصد"];
const STRONG_MATCH_SCORE = 95;
const GOOD_MATCH_SCORE = 50;
const CONTACT_MATCH_SCORE = 40;
const TOP_CATEGORIES = [...new Set(CHAT_DATASET.services.map((item) => item.category))]
  .filter(Boolean)
  .slice(0, 6);
const AMBIGUOUS_TOPIC_CONFIGS = [
  {
    id: "license",
    matchedType: "clarify_license",
    keywords: ["رخصه", "رخصة", "رخصتي"],
    specificHints: [
      "قياده",
      "قيادة",
      "سياره",
      "سيارة",
      "دوليه",
      "دولية",
      "مرشد",
      "سياحي",
      "سياحية",
      "بناء",
      "محل",
      "مركبه",
      "مركبة",
    ],
    followUpPrefix: "رخصة",
    answer:
      "تقصد أي رخصة بالضبط؟ اختر الأقرب، أو اكتب النوع الذي تريده وسأكمل معك.",
    suggestions: {
      default: [
        "استخراج رخصة قيادة لأول مرة",
        "تجديد رخصة القيادة",
        "بدل فاقد أو تالف لرخصة القيادة",
        "رخصة قيادة دولية",
      ],
      renewal: [
        "تجديد رخصة القيادة",
        "تجديد رخصة السيارة",
        "رخصة قيادة دولية",
      ],
      replacement: [
        "بدل فاقد أو تالف لرخصة القيادة",
        "بدل فاقد أو تالف لرخصة السيارة",
        "رخصة قيادة دولية",
      ],
      firstTime: [
        "استخراج رخصة قيادة لأول مرة",
        "استخراج رخصة سيارة لأول مرة",
        "رخصة قيادة دولية",
      ],
    },
  },
  {
    id: "card",
    matchedType: "clarify_card",
    keywords: ["بطاقه", "بطاقة"],
    specificHints: [
      "قومي",
      "رقم",
      "شخصيه",
      "شخصية",
      "تموين",
      "تموينيه",
      "تموينية",
      "صحيه",
      "صحية",
      "تطعيم",
      "خدمات",
      "متكامله",
      "متكاملة",
      "ميزة",
      "بريديه",
      "بريدية",
      "ضريبيه",
      "ضريبية",
    ],
    followUpPrefix: "بطاقة",
    answer:
      "تقصد أي بطاقة؟ اختر من الاختيارات التالية، أو اكتب النوع الذي تريده بشكل أوضح.",
    suggestions: {
      default: [
        "استخراج بطاقة الرقم القومي لأول مرة",
        "تجديد بطاقة الرقم القومي",
        "بدل فاقد أو تالف للبطاقة الشخصية",
        "إصدار بطاقة تموينية جديدة",
      ],
      renewal: [
        "تجديد بطاقة الرقم القومي",
        "بدل فاقد أو تالف للبطاقة الشخصية",
        "إصدار بطاقة تموينية جديدة",
      ],
      replacement: [
        "بدل فاقد أو تالف للبطاقة الشخصية",
        "بدل فاقد أو تالف للبطاقة التموينية",
        "تجديد بطاقة الرقم القومي",
      ],
      firstTime: [
        "استخراج بطاقة الرقم القومي لأول مرة",
        "إصدار بطاقة تموينية جديدة",
        "استخراج بطاقة صحية",
      ],
    },
  },
];
const AMBIGUOUS_ACTION_HINTS = [
  ...RENEWAL_HINTS,
  ...FIRST_TIME_HINTS,
  "استخراج",
  "استخرج",
  "بدل",
  "فاقد",
  "تالف",
  "تالفه",
  "تالفة",
  "جديده",
  "جديدة",
];

const canonicalizeToken = (token) => {
  if (!token) return token;

  if (token.startsWith("ال") && token.length > 3) {
    return token.slice(2);
  }

  return token;
};

export const normalizeArabic = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) =>
  normalizeArabic(value)
    .split(" ")
    .map((token) => canonicalizeToken(token))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const uniqueValues = (items) => [...new Set(items.filter(Boolean))];

const getSemanticVariants = (tokens) =>
  [...new Set(tokens)]
    .flatMap((token) => SEMANTIC_EQUIVALENTS[token] || [])
    .map((token) => canonicalizeToken(normalizeArabic(token)))
    .filter(Boolean);

const entryTokenCache = new Map();

const getEntryTokens = (entry) => {
  if (!entryTokenCache.has(entry.id)) {
    entryTokenCache.set(entry.id, tokenize(entry.searchText));
  }

  return entryTokenCache.get(entry.id);
};

const isContactLikeQuery = (normalizedQuery, queryTokens) =>
  CONTACT_HINTS.some(
    (hint) => normalizedQuery.includes(hint) || queryTokens.includes(hint),
  );

const isServiceLikeQuery = (normalizedQuery) =>
  SERVICE_HINTS.some((hint) => normalizedQuery.includes(normalizeArabic(hint)));

const isDaleelAboutQuery = (query) => {
  const normalized = normalizeArabic(query);
  const hasDirectAboutHint = DALEEL_ABOUT_HINTS.some((hint) =>
    normalized.includes(normalizeArabic(hint)),
  );
  if (hasDirectAboutHint) return true;

  const mentionsName = normalized.includes("دليل") || normalized.includes("daleel");
  const hasAboutWithName = ABOUT_WITH_NAME_HINTS.some((hint) =>
    normalized.includes(normalizeArabic(hint)),
  );

  return mentionsName && hasAboutWithName;
};

const includesAnyHint = (normalizedQuery, hints) =>
  hints.some((hint) => normalizedQuery.includes(normalizeArabic(hint)));

const getClarificationSuggestionSet = (config, normalizedQuery) => {
  const hasRenewalHint = includesAnyHint(normalizedQuery, RENEWAL_HINTS);
  const hasFirstTimeHint = includesAnyHint(normalizedQuery, FIRST_TIME_HINTS);
  const hasReplacementHint = includesAnyHint(normalizedQuery, [
    "بدل",
    "فاقد",
    "تالف",
    "تالفه",
    "تالفة",
  ]);

  if (hasReplacementHint) {
    return config.suggestions.replacement || config.suggestions.default;
  }

  if (hasRenewalHint) {
    return config.suggestions.renewal || config.suggestions.default;
  }

  if (hasFirstTimeHint) {
    return config.suggestions.firstTime || config.suggestions.default;
  }

  return config.suggestions.default;
};

const findAmbiguousTopicConfig = (queryTokens, normalizedQuery) => {
  if (!queryTokens.length) return null;

  return (
    AMBIGUOUS_TOPIC_CONFIGS.find(({ keywords, specificHints }) => {
      const normalizedKeywords = keywords.map((keyword) =>
        canonicalizeToken(normalizeArabic(keyword)),
      );
      const normalizedSpecificHints = (specificHints || []).map((hint) =>
        canonicalizeToken(normalizeArabic(hint)),
      );
      const hasKeyword = queryTokens.some((token) =>
        normalizedKeywords.includes(token),
      );
      const hasSpecificSubtype = queryTokens.some((token) =>
        normalizedSpecificHints.includes(token),
      );
      const allowedModifierTokens = AMBIGUOUS_ACTION_HINTS.map((token) =>
        canonicalizeToken(normalizeArabic(token)),
      );
      const onlyGenericContext = queryTokens.every(
        (token) =>
          normalizedKeywords.includes(token) || allowedModifierTokens.includes(token),
      );

      return (
        hasKeyword &&
        !hasSpecificSubtype &&
        (onlyGenericContext || queryTokens.length <= 3 || includesAnyHint(normalizedQuery, keywords))
      );
    }) || null
  );
};

const getLastAssistantClarification = (history = []) => {
  const assistantEntries = history.filter((item) => item.role === "assistant");
  const lastAssistantEntry = assistantEntries[assistantEntries.length - 1];

  if (!lastAssistantEntry?.matchedType) {
    return null;
  }

  return (
    AMBIGUOUS_TOPIC_CONFIGS.find(
      ({ matchedType }) => matchedType === lastAssistantEntry.matchedType,
    ) || null
  );
};

const buildClarificationAnswer = (config) => ({
  answer: config.answer,
  matchedType: config.matchedType,
  confidence: 0.92,
  service: null,
  reference: null,
  suggestions: config.suggestions.default || [],
});

const resolveClarificationAwareMessage = (message, history = []) => {
  const normalizedMessage = normalizeArabic(message);
  const queryTokens = uniqueValues(tokenize(message));
  const clarificationConfig = getLastAssistantClarification(history);

  if (!clarificationConfig) {
    return message;
  }

  const normalizedKeywords = clarificationConfig.keywords.map((keyword) =>
    canonicalizeToken(normalizeArabic(keyword)),
  );
  const alreadyMentionsTopic = queryTokens.some((token) =>
    normalizedKeywords.includes(token),
  );

  if (alreadyMentionsTopic || queryTokens.length === 0 || queryTokens.length > 3) {
    return message;
  }

  const correctionOnly =
    queryTokens.length === 1 && includesAnyHint(normalizedMessage, CORRECTION_HINTS);

  if (correctionOnly) {
    return message;
  }

  return `${clarificationConfig.followUpPrefix} ${message}`.trim();
};

const getCustomPersonAnswer = (query) => {
  const normalizedQuery = normalizeArabic(query);

  if (!normalizedQuery) return null;

  const askingWho =
    normalizedQuery.includes("مين") ||
    normalizedQuery.includes("من") ||
    normalizedQuery.startsWith("هو ") ||
    normalizedQuery.startsWith("ايه ");

  for (const item of CUSTOM_PERSON_RESPONSES) {
    const hasAlias = item.aliases.some((alias) =>
      normalizedQuery.includes(normalizeArabic(alias)),
    );

    if (hasAlias && askingWho) {
      const selectedAnswer = Array.isArray(item.answers)
        ? item.answers[Math.floor(Math.random() * item.answers.length)]
        : item.answer;

      return {
        answer: selectedAnswer,
        matchedType: "custom_person",
        confidence: 0.99,
        service: null,
        reference: null,
        suggestions: [],
      };
    }
  }

  return null;
};

const detectIntent = (query, normalizedQuery, queryTokens, topMatch) => {
  if (includesAnyHint(normalizedQuery, GREETING_HINTS)) return "greeting";
  if (includesAnyHint(normalizedQuery, THANKS_HINTS)) return "thanks";
  if (includesAnyHint(normalizedQuery, GOODBYE_HINTS)) return "goodbye";
  if (includesAnyHint(normalizedQuery, HELP_HINTS)) return "help";
  if (isDaleelAboutQuery(query)) return "about_daleel";

  const contactLike = isContactLikeQuery(normalizedQuery, queryTokens);
  const serviceLike = isServiceLikeQuery(normalizedQuery);

  if (contactLike && !serviceLike) return "contact_lookup";
  if (serviceLike) return "service_lookup";

  if (topMatch?.entry?.type === "service" && topMatch.score >= GOOD_MATCH_SCORE) {
    return "service_lookup";
  }
  if (
    (topMatch?.entry?.type === "contact" || topMatch?.entry?.type === "platform") &&
    topMatch.score >= CONTACT_MATCH_SCORE
  ) {
    return "contact_lookup";
  }

  if (includesAnyHint(normalizedQuery, OFF_TOPIC_HINTS)) {
    return "off_topic";
  }

  return "general";
};

const scoreEntry = (query, entry) => {
  const normalizedQuery = normalizeArabic(query);
  const queryTokens = [...new Set(tokenize(query))];
  const semanticQueryTokens = getSemanticVariants(queryTokens).filter(
    (token) => !queryTokens.includes(token),
  );
  const entryTokens = getEntryTokens(entry);
  const entryText = normalizeArabic(entry.searchText);
  const primaryLabel = normalizeArabic(
    entry.service || entry.label || entry.text || "",
  );
  const labelTokens = tokenize(primaryLabel);
  const contactLikeQuery = isContactLikeQuery(normalizedQuery, queryTokens);
  const serviceLikeQuery = isServiceLikeQuery(normalizedQuery);

  if (!normalizedQuery) return 0;

  let score = 0;

  if (primaryLabel === normalizedQuery) {
    score += 140;
  }

  if (primaryLabel && normalizedQuery.includes(primaryLabel)) {
    score += 90;
  }

  if (primaryLabel && primaryLabel.includes(normalizedQuery)) {
    score += 110;
  }

  if (entryText.includes(normalizedQuery)) {
    score += 70;
  }

  let matchedTokens = 0;

  for (const token of queryTokens) {
    if (entryTokens.includes(token)) {
      matchedTokens += 1;
      score += token.length >= 4 ? 18 : 8;

      if (labelTokens.includes(token)) {
        score += token.length >= 4 ? 16 : 7;
      }
    }
  }

  let semanticMatches = 0;

  for (const token of semanticQueryTokens) {
    if (entryTokens.includes(token)) {
      semanticMatches += 1;
      score += token.length >= 4 ? 10 : 5;

      if (labelTokens.includes(token)) {
        score += token.length >= 4 ? 8 : 4;
      }
    }
  }

  if (queryTokens.length > 0) {
    score += Math.round((matchedTokens / queryTokens.length) * 60);
  }

  if (semanticQueryTokens.length > 0) {
    score += Math.round((semanticMatches / semanticQueryTokens.length) * 24);
  }

  if (queryTokens.length > 1 && queryTokens.every((token) => entryTokens.includes(token))) {
    score += 60;
  }

  if (
    labelTokens.length > 0 &&
    queryTokens.length > 0 &&
    queryTokens.every((token) => labelTokens.includes(token))
  ) {
    score += 80;
  }

  if (contactLikeQuery && !serviceLikeQuery) {
    if (entry.type === "contact" || entry.type === "platform") {
      score += 50;
    }

    if (entry.type === "service") {
      score -= 15;
    }
  } else if (entry.type === "service") {
    score += 12;

    if (serviceLikeQuery) {
      score += 35;
    }
  }

  return score;
};

const retrieveMatches = (query, limit = 5) =>
  CHAT_ENTRIES.map((entry) => ({
    entry,
    score: scoreEntry(query, entry),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

const refineMatchesWithIntentSignals = (query, matches, history = []) => {
  const normalizedQuery = normalizeArabic(query);
  const hasRenewalHint = includesAnyHint(normalizedQuery, RENEWAL_HINTS);
  const hasFirstTimeHint = includesAnyHint(normalizedQuery, FIRST_TIME_HINTS);
  const hasCorrectionHint = includesAnyHint(normalizedQuery, CORRECTION_HINTS);
  const lastHistoryText = normalizeArabic(
    history
      .slice(-3)
      .map((item) => item.content)
      .join(" "),
  );
  const likelyCorrectionTurn =
    hasCorrectionHint || (normalizedQuery.includes("لا") && lastHistoryText.length > 0);

  return [...matches]
    .map((item) => {
      const serviceName = normalizeArabic(item.entry?.service || "");
      let score = item.score;

      if (item.entry?.type === "service") {
        const isRenewalService = serviceName.includes("تجديد");
        const isFirstTimeService =
          serviceName.includes("لاول مره") || serviceName.includes("اول مره");

        if (hasRenewalHint) {
          score += isRenewalService ? 80 : 0;
          score -= isFirstTimeService ? 70 : 0;
        }

        if (hasFirstTimeHint && !hasRenewalHint) {
          score += isFirstTimeService ? 80 : 0;
          score -= isRenewalService ? 55 : 0;
        }

        if (likelyCorrectionTurn && hasRenewalHint && isFirstTimeService) {
          score -= 90;
        }

        if (likelyCorrectionTurn && hasFirstTimeHint && isRenewalService) {
          score -= 90;
        }
      }

      return {
        ...item,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
};

const pickPreferredTopMatch = (query, matches) => {
  if (!matches?.length) return null;

  const normalizedQuery = normalizeArabic(query);
  const hasRenewalHint = includesAnyHint(normalizedQuery, RENEWAL_HINTS);
  const hasFirstTimeHint = includesAnyHint(normalizedQuery, FIRST_TIME_HINTS);

  const findServiceByKeyword = (keyword) =>
    matches.find(
      ({ entry, score }) =>
        entry?.type === "service" &&
        normalizeArabic(entry.service || "").includes(normalizeArabic(keyword)) &&
        score >= CONTACT_MATCH_SCORE,
    );

  if (hasRenewalHint) {
    const renewalCandidate = findServiceByKeyword("تجديد");
    if (renewalCandidate) return renewalCandidate;
  }

  if (hasFirstTimeHint && !hasRenewalHint) {
    const firstTimeCandidate = matches.find(
      ({ entry, score }) =>
        entry?.type === "service" &&
        (normalizeArabic(entry.service || "").includes("لاول مره") ||
          normalizeArabic(entry.service || "").includes("اول مره")) &&
        score >= CONTACT_MATCH_SCORE,
    );
    if (firstTimeCandidate) return firstTimeCandidate;
  }

  return matches[0];
};

const getFallbackSuggestions = (matches) =>
  matches
    .map(({ entry }) => entry.service || entry.label || entry.text)
    .filter(Boolean)
    .slice(1, 4);

const GENERAL_CHAT_SUGGESTIONS = [
  "ما المطلوب لاستخراج بطاقة رقم قومي؟",
  "إزاي أجدد رخصة القيادة؟",
  "فين أقدم على شهادة ميلاد؟",
];
const SOCIAL_INTENTS = new Set(["greeting", "thanks", "goodbye", "help"]);

const buildIntentFallbackAnswer = (intent, message) => {
  if (intent === "greeting") {
    return {
      answer: [
        "أهلًا بيك، أنا دليل.",
        "اسألني عن أي خدمة حكومية، وأنا أرتب لك المطلوب: الأوراق، الخطوات، الرسوم، المدة، والجهة المسؤولة.",
      ].join("\n"),
      matchedType: "greeting",
      confidence: 0.9,
      service: null,
      reference: null,
      suggestions: GENERAL_CHAT_SUGGESTIONS,
    };
  }

  if (intent === "thanks") {
    return {
      answer:
        "العفو، تحت أمرك. اكتب اسم الخدمة أو وصف بسيط للي محتاجه، وأنا أطلع لك أقرب إجراء من الدليل.",
      matchedType: "thanks",
      confidence: 0.95,
      service: null,
      reference: null,
      suggestions: [
        "إجراءات تجديد جواز السفر",
        "المطلوب لاستخراج شهادة ميلاد",
        "رقم الخط الساخن للمرور",
      ],
    };
  }

  if (intent === "goodbye") {
    return {
      answer:
        "تشرفت بمساعدتك. لما تحتاج أي ورق أو خطوة حكومية، ارجع اكتب اسم الخدمة وهكمل معاك.",
      matchedType: "goodbye",
      confidence: 0.95,
      service: null,
      reference: null,
      suggestions: [],
    };
  }

  if (intent === "help") {
    return {
      answer: [
        "أكيد. قول لي اسم الخدمة أو اللي عايز تعمله، حتى لو بصيغة بسيطة.",
        "أقدر أساعدك في الأوراق المطلوبة، خطوات التقديم، الرسوم، المدة، الجهة المسؤولة، وروابط أو أرقام التواصل المتاحة.",
      ].join("\n"),
      matchedType: "help",
      confidence: 0.9,
      service: null,
      reference: null,
      suggestions: [
        "عايز أطلع بطاقة رقم قومي لأول مرة",
        "إزاي أجدد جواز السفر؟",
        "رقم النجدة أو الإسعاف",
      ],
    };
  }

  if (intent === "off_topic") {
    return {
      answer:
        "أقدر أجاوبك بشكل عام، لكن أفضل مساعدة دقيقة أقدمها لك هي في الخدمات الحكومية المصرية. لو تحب، اكتب اسم الخدمة أو الجهة وسأعطيك المطلوب خطوة بخطوة.",
      matchedType: "off_topic",
      confidence: 0.75,
      service: null,
      reference: null,
      suggestions: [
        "مثال: ما المطلوب لتجديد رخصة القيادة؟",
        "مثال: رقم الخط الساخن للنجدة أو الإسعاف",
      ],
    };
  }

  if (intent === "about_daleel" || isDaleelAboutQuery(message)) {
    return {
      answer: [
        `نحن ${DALEEL_PROFILE.name} (${DALEEL_PROFILE.englishName})، ${DALEEL_PROFILE.tagline}`,
        DALEEL_PROFILE.mission,
        `رؤيتنا: ${DALEEL_PROFILE.vision}`,
        `من نحن: ${DALEEL_PROFILE.positioning}`,
        `نطاق المنصة: ${DALEEL_PROFILE.coverageSummary}`,
        `ماذا نقدم:`,
        ...DALEEL_PROFILE.whatWeDo.map((item) => `- ${item}`),
        `ما يميزنا:`,
        ...DALEEL_PROFILE.differentiators.map((item) => `- ${item}`),
        `باختصار: ${DALEEL_PROFILE.valueProposition}`,
        `التواصل: ${DALEEL_PROFILE.support.email} | ${DALEEL_PROFILE.support.phone}`,
      ].join("\n"),
      matchedType: "about_daleel",
      confidence: 0.95,
      service: null,
      reference: { text: DALEEL_PROFILE.mission },
      suggestions: [
        "اسألني عن خدمة حكومية محددة مثل تجديد البطاقة.",
        "اسألني عن الأوراق المطلوبة لأي معاملة حكومية.",
      ],
    };
  }

  return {
    answer:
      "أنا معاك. اكتب اسم الخدمة أو الجهة أو وصف قصير للي عايزه، وأنا أبحث في دليل الخدمات وأرجع لك بأقرب نتيجة منظمة.",
    matchedType: "general",
    confidence: 0.7,
    service: null,
    reference: null,
    suggestions: [
      ...GENERAL_CHAT_SUGGESTIONS.slice(0, 2),
      `من التصنيفات المتاحة: ${TOP_CATEGORIES.slice(0, 3).join("، ")}`,
    ],
  };
};

const buildServicePayload = (entry, confidence) => ({
  name: entry.service,
  service: entry.service,
  category: entry.category,
  description: entry.description,
  steps:
    entry.steps?.length > 0
      ? entry.steps
      : entry.channels?.map((channel) => `التقديم عبر: ${channel}`) || [],
  documents: entry.documents || [],
  channels: entry.channels || [],
  fees: entry.fees,
  duration: entry.duration,
  authority: entry.authority,
  website: entry.website || entry.authorityWebsite,
  online: entry.online,
  confidence,
});

const buildDeterministicAnswer = (entry, confidence) => {
  if (!entry) {
    return {
      answer:
        "لم أجد تطابقًا واضحًا في البيانات الحالية. حاول كتابة اسم الخدمة أو الجهة بشكل أوضح، مثل: استخراج بطاقة رقم قومي أو تجديد جواز سفر.",
      matchedType: "unknown",
      confidence,
      service: null,
      reference: null,
      suggestions: CHAT_DATASET.services
        .slice(0, 4)
        .map((item) => item.service),
    };
  }

  if (entry.type === "service") {
    const servicePayload = buildServicePayload(entry, confidence);
    const lines = [
      `الخدمة الأقرب لطلبك هي: ${entry.service}.`,
      entry.description ? `الوصف: ${entry.description}` : null,
      entry.category ? `التصنيف: ${entry.category}` : null,
      entry.authority ? `الجهة المسؤولة: ${entry.authority}` : null,
      entry.fees ? `الرسوم: ${entry.fees}` : null,
      entry.duration ? `المدة المتوقعة: ${entry.duration}` : null,
      entry.online
        ? "الخدمة متاحة إلكترونيًا أو جزئيًا عبر القنوات المذكورة."
        : "الخدمة غالبًا تحتاج تقديمًا حضوريًا أو عبر الجهة المختصة.",
    ].filter(Boolean);

    return {
      answer: lines.join("\n"),
      matchedType: "service",
      confidence,
      service: servicePayload,
      reference: null,
      suggestions: [],
    };
  }

  if (entry.type === "contact") {
    const parts = [
      `أفضل جهة مطابقة هي: ${entry.label}.`,
      entry.number ? `رقم التواصل: ${entry.number}` : null,
      entry.website ? `الموقع: ${entry.website}` : null,
    ].filter(Boolean);

    return {
      answer: parts.join("\n"),
      matchedType: "contact",
      confidence,
      service: null,
      reference: {
        label: entry.label,
        number: entry.number || null,
        website: entry.website || null,
        kind: entry.kind,
      },
      suggestions: [],
    };
  }

  if (entry.type === "platform") {
    const parts = [
      `المنصة الأقرب لطلبك هي: ${entry.label}.`,
      entry.website ? `الموقع: ${entry.website}` : null,
      entry.hotline ? `الخط الساخن: ${entry.hotline}` : null,
      entry.email ? `البريد الإلكتروني: ${entry.email}` : null,
    ].filter(Boolean);

    return {
      answer: parts.join("\n"),
      matchedType: "platform",
      confidence,
      service: null,
      reference: {
        label: entry.label,
        website: entry.website || null,
        hotline: entry.hotline || null,
        email: entry.email || null,
      },
      suggestions: [],
    };
  }

  return {
    answer: entry.text,
    matchedType: "note",
    confidence,
    service: null,
    reference: { text: entry.text },
    suggestions: [],
  };
};

const buildGroqPrompt = (message, matches, deterministic, intent, history = []) => {
  const context = matches.slice(0, 5).map(({ entry, score }) => ({
    score,
    type: entry.type,
    service: entry.service || null,
    category: entry.category || null,
    description: entry.description || null,
    documents: entry.documents || [],
    steps: entry.steps || [],
    channels: entry.channels || [],
    fees: entry.fees || null,
    duration: entry.duration || null,
    label: entry.label || null,
    number: entry.number || null,
    website: entry.website || entry.authorityWebsite || null,
    authority: entry.authority || null,
    text: entry.text || null,
  }));
  const compactHistory = history.slice(-6).map((item) => ({
    role: item.role,
    content: item.content,
  }));
  const referenceContext =
    context.length > 0
      ? JSON.stringify(context, null, 2)
      : "لا توجد معلومات مرجعية قوية لهذا السؤال.";
  const historyContext =
    compactHistory.length > 0
      ? JSON.stringify(compactHistory, null, 2)
      : "لا يوجد سجل سابق مهم.";

  return {
    system: `
أنت "دليل"، مساعد ذكي تفاعلي للمواطن المصري.
تتصرف كمساعد محادثة قوي ومرن: ذكي في الأسئلة العامة، ودقيق جدًا في الإجراءات الحكومية.
${TONE_INSTRUCTION_MAP[CHAT_BRAND_TONE] || TONE_INSTRUCTION_MAP.professional}
القاعدة الذهبية:
إذا كان سؤال المستخدم عن خدمة حكومية أو أوراق أو رسوم أو خطوات أو جهة رسمية، اعتمد أولًا على المعلومات المرجعية المرفقة.
إذا كان السؤال عامًا أو دردشة أو معرفة عامة، أجب بذكاء وبطلاقة من معرفتك العامة دون أن تتقيد بالداتا.
لا تؤلف أبدًا تفاصيل حكومية أو رسومًا أو أوراقًا أو روابط رسمية غير موجودة في المعلومات المرجعية.
إذا كانت المعلومات المرجعية غير كافية لسؤال حكومي محدد، قل ذلك بوضوح واسأل سؤالًا توضيحيًا واحدًا فقط.
إذا صحح المستخدم قصده، فالأولوية للتصحيح الأخير.
إذا سأل المستخدم عن "دليل" نفسه أو المنصة، استخدم ملف التعريف المرفق.
إذا وجدت معلومات مرجعية قوية، فرتب الإجابة عمليًا هكذا:
1) اسم الخدمة أو الإجراء
2) المستندات المطلوبة
3) الخطوات أو قنوات التقديم
4) الرسوم والمدة إن وجدت
5) ملاحظة مفيدة قصيرة
أجب دائمًا بالعربية حتى لو كان السؤال بالإنجليزية.
أعد دائمًا JSON صحيحًا بهذا الشكل فقط:
{
  "answer": "string",
  "suggestions": ["string", "string"]
}
اجعل الإجابة طبيعية ومختصرة ومفيدة، وليس أسلوبًا آليًا جافًا.
    `.trim(),
    user: `
[ملف تعريف دليل]:
${JSON.stringify(DALEEL_PROFILE, null, 2)}

[نية السؤال المتوقعة]:
${intent}

[المعلومات المرجعية المرتبطة]:
${referenceContext}

[إجابة محلية مقترحة من نظام الاسترجاع]:
${deterministic.answer}

[سجل محادثة مختصر]:
${historyContext}

[سؤال المستخدم]:
${message}
    `.trim(),
  };
};

const requestGroqJson = async (message, matches, deterministic, intent, history = []) => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const prompt = buildGroqPrompt(message, matches, deterministic, intent, history);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.CHAT_MODEL || "llama-3.3-70b-versatile",
      temperature: Number(process.env.CHAT_TEMPERATURE || 0.6),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  const parsed = JSON.parse(content);

  return {
    answer:
      typeof parsed.answer === "string" && parsed.answer.trim()
        ? parsed.answer.trim()
        : null,
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((item) => typeof item === "string")
      : [],
  };
};

export const generateChatReply = async (message, options = {}) => {
  const history = Array.isArray(options.history) ? options.history : [];
  const clarificationAwareMessage = resolveClarificationAwareMessage(
    message,
    history,
  );
  const customPersonAnswer = getCustomPersonAnswer(message);

  if (customPersonAnswer) {
    return {
      ...customPersonAnswer,
      usedGroq: false,
      provider: "local_fallback",
      statusMessage: "Response generated from custom local response rules.",
    };
  }

  const normalizedQuery = normalizeArabic(clarificationAwareMessage);
  const queryTokens = uniqueValues(tokenize(clarificationAwareMessage));
  const ambiguousTopicConfig = findAmbiguousTopicConfig(
    queryTokens,
    normalizedQuery,
  );

  if (ambiguousTopicConfig) {
    return {
      ...buildClarificationAnswer(ambiguousTopicConfig),
      suggestions: getClarificationSuggestionSet(
        ambiguousTopicConfig,
        normalizedQuery,
      ),
      usedGroq: false,
      provider: "local_fallback",
      statusMessage: "Response generated from clarification rules.",
    };
  }

  const baseMatches = retrieveMatches(clarificationAwareMessage);
  const matches = refineMatchesWithIntentSignals(
    clarificationAwareMessage,
    baseMatches,
    history,
  );
  const topMatch = pickPreferredTopMatch(clarificationAwareMessage, matches);
  const intent = detectIntent(
    clarificationAwareMessage,
    normalizedQuery,
    queryTokens,
    topMatch,
  );
  const hasStrongMatch = Boolean(topMatch && topMatch.score >= STRONG_MATCH_SCORE);
  const hasGoodMatch = Boolean(topMatch && topMatch.score >= GOOD_MATCH_SCORE);
  const hasContactMatch = Boolean(topMatch && topMatch.score >= CONTACT_MATCH_SCORE);
  const shouldUseDatasetAnswer =
    (intent === "service_lookup" && (hasStrongMatch || hasGoodMatch)) ||
    (intent === "contact_lookup" && hasContactMatch) ||
    (intent === "general" && hasStrongMatch);
  const confidence = topMatch
    ? Number(Math.min(0.99, topMatch.score / 220).toFixed(2))
    : 0;

  const deterministic = shouldUseDatasetAnswer
    ? buildDeterministicAnswer(topMatch?.entry || null, confidence)
    : buildIntentFallbackAnswer(intent, message);

  deterministic.suggestions =
    deterministic.suggestions.length > 0
      ? deterministic.suggestions
      : SOCIAL_INTENTS.has(intent)
        ? []
        : getFallbackSuggestions(matches);

  const promptMatches = shouldUseDatasetAnswer ? matches : [];

  try {
    const groqJson = await requestGroqJson(
      clarificationAwareMessage,
      promptMatches,
      deterministic,
      intent,
      history,
    );

    if (groqJson?.answer) {
      return {
        ...deterministic,
        answer: groqJson.answer,
        suggestions:
          groqJson.suggestions?.length > 0
            ? groqJson.suggestions
            : deterministic.suggestions,
        usedGroq: true,
        provider: "groq",
        statusMessage: "Response generated by Groq model.",
      };
    }
  } catch (error) {
    return {
      ...deterministic,
      usedGroq: false,
      provider: "local_fallback",
      statusMessage:
        "Groq is unavailable; response generated from local retrieval fallback.",
      debug: error.message,
    };
  }

  return {
    ...deterministic,
    usedGroq: false,
    provider: "local_fallback",
    statusMessage:
      "Groq did not return usable output; response generated from local retrieval fallback.",
  };
};
