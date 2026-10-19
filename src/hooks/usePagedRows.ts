import { useEffect, useState } from "react";

/**
 * Client-side paging for endpoints that return a plain array. Resets to the
 * first page whenever `resetKey` changes (filters, tabs, search).
 */
export default function usePagedRows<T>(
  rows: T[] | undefined,
  perPage = 10,
  resetKey?: unknown,
) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);
  const list = rows ?? [];
  const lastPage = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(page, lastPage);
  return {
    rows: list.slice((current - 1) * perPage, current * perPage),
    page: current,
    lastPage,
    total: list.length,
    perPage,
    setPage,
  };
}
