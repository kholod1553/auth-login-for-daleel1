import {
  createRequestSupabaseClient,
  supabase,
} from "../supabaseClient.js";

export const requireAuth = async (req, res, next) => {
  // 1. تحقق من الـ Session أولاً
  if (req.session?.user) {
    req.user = req.session.user;
    req.accessToken = req.session.user.accessToken;

    // بدون التوكن مفيش RLS صحيح — لازم يكون محفوظ في الـ session
    if (!req.accessToken) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    req.supabase = createRequestSupabaseClient(req.accessToken);
    return next();
  }

  // 2. تحقق من الـ Token (Bearer)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized. Please log in first." });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = data.user;
  req.accessToken = token;
  req.supabase = createRequestSupabaseClient(token);
  return next();
};
