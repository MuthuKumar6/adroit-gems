import { useMemo, useState, useEffect } from "react";

export function useTableData<T>(
  rows: T[],
  searchFn: (row: T, query: string) => boolean,
  pageSize = 10,
) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => searchFn(r, q));
  }, [rows, search, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return {
    search,
    setSearch: (v: string) => {
      setSearch(v);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    pageSize,
    filtered,
    paged,
    totalCount: filtered.length,
  };
}
