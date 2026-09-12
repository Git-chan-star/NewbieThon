export const applicationTransitions = Object.freeze({
  submitted: ["viewed", "withdrawn"],
  viewed: ["chatting", "interview", "accepted", "rejected", "withdrawn"],
  chatting: ["interview", "accepted", "rejected", "withdrawn"],
  interview: ["chatting", "accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: ["viewed"],
  withdrawn: [],
});

export const engagementTransitions = Object.freeze({
  ready: ["in_progress", "canceled", "disputed"],
  in_progress: ["submitted", "canceled", "disputed"],
  submitted: ["revision_requested", "completed", "disputed"],
  revision_requested: ["submitted", "canceled", "disputed"],
  completed: [],
  canceled: [],
  disputed: [],
});

export function canTransition(table, from, to) {
  return Boolean(table[from]?.includes(to));
}
