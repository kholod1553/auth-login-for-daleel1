import { supabase } from "../supabaseClient.js";

const emptyVoteSummary = (userVote = null) => ({
  upvotes: 0,
  downvotes: 0,
  score: 0,
  total: 0,
  user_vote: userVote,
});

const normalizeServiceId = (serviceId) => String(serviceId || "").trim();

export const buildVoteSummary = (votes = [], userId = null) => {
  const summary = emptyVoteSummary();

  for (const vote of votes || []) {
    if (vote.vote_type === "up") summary.upvotes += 1;
    if (vote.vote_type === "down") summary.downvotes += 1;

    if (userId && vote.user_id === userId) {
      summary.user_vote = vote.vote_type;
    }
  }

  summary.score = summary.upvotes - summary.downvotes;
  summary.total = summary.upvotes + summary.downvotes;

  return summary;
};

export const getVoteSummary = async (serviceId, userId = null) => {
  const normalizedServiceId = normalizeServiceId(serviceId);

  if (!normalizedServiceId) {
    return emptyVoteSummary();
  }

  const { data, error } = await supabase
    .from("votes")
    .select("user_id, vote_type")
    .eq("service_id", normalizedServiceId);

  if (error) throw error;

  return buildVoteSummary(data || [], userId);
};

export const getServiceEngagementMap = async (
  serviceIds,
  { includeComments = true, userId = null } = {},
) => {
  const ids = [...new Set((serviceIds || []).map(normalizeServiceId).filter(Boolean))];
  const initialEntries = ids.map((id) => [
    id,
    {
      comments: [],
      comment_count: 0,
      votes: emptyVoteSummary(),
      vote_score: 0,
    },
  ]);
  const engagementByServiceId = new Map(initialEntries);

  if (ids.length === 0) {
    return engagementByServiceId;
  }

  const [commentsResult, votesResult] = await Promise.all([
    includeComments
      ? supabase
          .from("comments")
          .select("id, service_id, user_id, user_name, content, rating, created_at")
          .in("service_id", ids)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("votes")
      .select("service_id, user_id, vote_type")
      .in("service_id", ids),
  ]);

  if (commentsResult.error) {
    return engagementByServiceId;
  }

  for (const comment of commentsResult.data || []) {
    const serviceId = normalizeServiceId(comment.service_id);
    const engagement = engagementByServiceId.get(serviceId);

    if (!engagement) continue;

    engagement.comments.push(comment);
    engagement.comment_count += 1;
  }

  if (votesResult.error) {
    return engagementByServiceId;
  }

  const votesByServiceId = new Map();
  for (const vote of votesResult.data || []) {
    const serviceId = normalizeServiceId(vote.service_id);
    const existing = votesByServiceId.get(serviceId) || [];
    existing.push(vote);
    votesByServiceId.set(serviceId, existing);
  }

  for (const [serviceId, votes] of votesByServiceId.entries()) {
    const engagement = engagementByServiceId.get(serviceId);

    if (!engagement) continue;

    engagement.votes = buildVoteSummary(votes, userId);
    engagement.vote_score = engagement.votes.score;
  }

  return engagementByServiceId;
};

export const getServiceEngagement = async (
  serviceId,
  { includeComments = true, userId = null } = {},
) => {
  const engagementMap = await getServiceEngagementMap([serviceId], {
    includeComments,
    userId,
  });

  return (
    engagementMap.get(normalizeServiceId(serviceId)) || {
      comments: [],
      comment_count: 0,
      votes: emptyVoteSummary(),
      vote_score: 0,
    }
  );
};
