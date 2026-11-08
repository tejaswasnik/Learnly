"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            Search courses
          </label>
          <div className="flex h-12 items-center gap-2 rounded-base bg-field pl-3 pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-light">
            <Icon name="search" size={20} />
            <input
              id="catalog-search"
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search courses"
              className="min-w-0 flex-1 bg-transparent text-body text-field-ink placeholder:text-field-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="relative md:w-70">
          <label htmlFor="catalog-sort" className="sr-only">
            Sort courses
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => router.push(hrefFor({ sort: e.target.value }))}
            className="h-12 w-full appearance-none rounded-base bg-field px-4 pr-12 text-body text-field-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort by: {o.label.replace(/^Price: /, "Price ")}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <Icon name="expand-more" size={24} />
          </span>
        </div>

        {hasFilters && (
          <Button variant="ghost" leadingIcon="filter-clear" onClick={() => router.push(pathname)}>
            Clear filters
          </Button>
        )}
      </div>

      <div role="group" aria-label="Category" className="-mx-(--m) flex gap-2 overflow-x-auto px-(--m) pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {["", ...CATEGORIES].map((c) => {
          const active = c === category;
          return (
            <button
              key={c || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => router.push(hrefFor({ category: c }))}
              className={`h-11 shrink-0 rounded-full px-4 text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
                active ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink hover:bg-border"
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
