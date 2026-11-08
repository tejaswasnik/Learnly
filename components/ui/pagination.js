import Link from "next/link";
import { Icon } from "@/components/ui/icon";

function pageWindow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach((p) => pages.add(p));
  if (page >= total - 2) [total - 1, total - 2].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const base =
  "inline-flex h-11 items-center justify-center rounded-base text-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light";

export function Pagination({ page, totalPages, hrefFor }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${base} gap-2 bg-surface px-4 text-muted hover:bg-surface-2`}>
          <Icon name="chevron-left" size={20} />
          <span className="max-sm:sr-only">Previous</span>
        </Link>
      ) : null}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="inline-flex size-11 items-center justify-center text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`${base} size-11 text-body ${p === page ? "bg-accent font-semibold text-accent-ink" : "text-ink hover:bg-surface-2"}`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={`${base} gap-2 bg-surface-2 px-4 text-ink hover:bg-border`}>
          <span className="max-sm:sr-only">Next</span>
          <Icon name="chevron-right" size={20} />
        </Link>
      ) : null}
    </nav>
  );
}
