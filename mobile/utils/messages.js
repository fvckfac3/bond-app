// Merge a message into a chat list without duplicating it. A message can arrive
// twice (initial fetch + Realtime INSERT, or a Realtime replay after reconnect).
export function mergeMessage(list, incoming) {
  if (!incoming?.id) return list;
  if (list.some((m) => m.id === incoming.id)) return list;
  return [...list, incoming].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

// Combine a fetched history with messages that arrived over Realtime meanwhile.
export function mergeHistory(current, fetched) {
  return (fetched || []).reduce((acc, m) => mergeMessage(acc, m), current);
}
