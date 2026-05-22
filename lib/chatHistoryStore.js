import { supabase } from "../supabaseClient.js";

const CHAT_RETENTION_DAYS = 15;
const CLEANUP_INTERVAL_MS = 1000 * 60 * 30;
let lastCleanupAt = 0;

const shouldCleanupNow = () => Date.now() - lastCleanupAt > CLEANUP_INTERVAL_MS;

const cutoffIsoDate = (days) => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
};

export const cleanupOldChatMessages = async () => {
  if (!shouldCleanupNow()) return;
  lastCleanupAt = Date.now();

  try {
    await supabase
      .from("chat_messages")
      .delete()
      .lt("created_at", cutoffIsoDate(CHAT_RETENTION_DAYS));
  } catch (error) {
    // Keep chat flow running even if storage cleanup fails.
  }
};

export const getRecentChatHistory = async (sessionId, limit = 12) => {
  if (!sessionId) return [];

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,session_id,sender,content,provider,matched_type,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data || []).reverse();
  } catch (error) {
    return [];
  }
};

export const saveChatExchange = async ({
  sessionId,
  userMessage,
  botMessage,
  provider,
  matchedType,
}) => {
  if (!sessionId || !userMessage || !botMessage) return;

  try {
    await supabase.from("chat_messages").insert([
      {
        session_id: sessionId,
        sender: "user",
        content: userMessage,
        provider: "client",
        matched_type: "user_message",
      },
      {
        session_id: sessionId,
        sender: "bot",
        content: botMessage.answer,
        provider: provider || "local_fallback",
        matched_type: matchedType || "general",
      },
    ]);
  } catch (error) {
    // Keep chat flow running even if storage write fails.
  }
};
