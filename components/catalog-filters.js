"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/shared/constants";

const DEBOUNCE_MS = 500;

export function CatalogFilters({ search = "", category = "", sort = "newest" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);

  // Follow external changes to ?search= (navbar search, clear filters) without clobbering typing.
  if (search !== seenSearch) {
    setSeenSearch(search);
    setValue(search);
  }

  function hrefFor(next) {
    const merged = { search, category, sort, ...next };
    const params = new URLSearchParams();
    if (merged.search) params.set("search", merged.search);
    if (merged.category) params.set("category", merged.category);
    if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === search) return;
    const id = setTimeout(() => router.push(hrefFor({ search: trimmed })), DEBOUNCE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hrefFor only reads current props
  }, [value, search]);

  const hasFilters = Boolean(search || category || sort !== "newest");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            Search courses
          </label>
          <input
            id="catalog-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search courses"
            className="w-full rounded-base bg-field px-3 py-2.5 text-field-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
          />
        </div>
        <div>
          <label htmlFor="catalog-sort" className="sr-only">
            Sort by
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => router.push(hrefFor({ sort: e.target.value }))}
            className="rounded-base bg-surface px-3 py-2.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="rounded-base px-3 py-2.5 text-small text-muted underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-t5"
          >
            Clear filters
          </button>
        )}
      </div>

      <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
        {["", ...CATEGORIES].map((c) => {
          const active = c === category;
          return (
            <button
              key={c || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => router.push(hrefFor({ category: c }))}
              className={`rounded-full px-4 py-1.5 text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5 ${
                active ? "bg-accent text-accent-ink" : "bg-surface text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {c || "All"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
