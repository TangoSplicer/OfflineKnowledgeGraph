export const SEARCH_HISTORY_LIMIT = 8;

export function addSearchToHistory(existing: string[], query: string, limit = SEARCH_HISTORY_LIMIT) {
  const normalized = query.trim();
  if (normalized.length < 2) return existing.slice(0, limit);
  return [normalized, ...existing.filter((entry) => entry.toLocaleLowerCase() !== normalized.toLocaleLowerCase())].slice(0, limit);
}

export function removeSearchFromHistory(existing: string[], query: string) {
  return existing.filter((entry) => entry !== query);
}
