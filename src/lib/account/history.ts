export const HISTORY_PAGE_SIZE = 20;
export type HistoryQuery = { page?: unknown; q?: unknown; status?: unknown };
export function historyQuery(input: HistoryQuery = {}) {
  const value = Number(input.page);
  return {
    page: Number.isSafeInteger(value) && value > 0 ? Math.min(value, 10000) : 1,
    q: typeof input.q === 'string' ? input.q.trim().slice(0, 100) : '',
    status: input.status === 'active' || input.status === 'completed' ? input.status : 'all',
  };
}
