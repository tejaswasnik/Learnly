"use client";

import Link from "next/link";
import { useState } from "react";
import { usePreview } from "@/components/course/preview-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatClock, formatTotalLength } from "@/lib/shared/format";

const INITIAL_VISIBLE = 8;

const rowBase =
  "flex h-16 w-full items-center gap-4 overflow-hidden rounded-base px-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light";

function RowBody({ index, lecture, locked, previewable }) {
  return (
    <>
      <span className="w-7 shrink-0 text-small text-muted">{String(index + 1).padStart(2, "0")}</span>
      <span className="flex size-7 shrink-0 items-center justify-center">
        <Icon name={locked ? "lock" : "play-arrow"} size={20} />
      </span>
      <span className={`min-w-0 flex-1 truncate text-body ${locked ? "text-muted" : "text-ink"}`}>{lecture.lectureTitle}</span>
      {previewable && <Badge variant="free-preview" className="hidden sm:inline-flex" />}
      <span className="shrink-0 text-small tabular-nums text-muted">{formatClock(lecture.duration)}</span>
    </>
  );
}

export function Curriculum({ course }) {
  const { activeId, setActiveId } = usePreview();
  const [expanded, setExpanded] = useState(false);
  const { lectures, canAccess } = course;
  const hidden = Math.max(0, lectures.length - INITIAL_VISIBLE);
  const visible = expanded ? lectures : lectures.slice(0, INITIAL_VISIBLE);
  const totalSeconds = lectures.reduce((sum, l) => sum + l.duration, 0);

  return (
    <section aria-labelledby="curriculum" className="rounded-card bg-surface p-6 md:p-8">
      <h2 id="curriculum" className="text-h2 text-ink">
        Curriculum
      </h2>
      <p className="mt-1 text-muted">
        {lectures.length} {lectures.length === 1 ? "lecture" : "lectures"}
        {totalSeconds > 0 ? `, ${formatTotalLength(totalSeconds)}` : ""}
      </p>

      {lectures.length === 0 ? (
        <p className="mt-6 text-muted">No lectures yet.</p>
      ) : (
        <ol className="mt-6 flex flex-col gap-2">
          {visible.map((lecture, i) => {
            const previewable = !canAccess && lecture.isPreviewFree && Boolean(lecture.videoUrl);
            const locked = !canAccess && !previewable;
            const body = <RowBody index={i} lecture={lecture} locked={locked} previewable={previewable} />;
            return (
              <li key={lecture.id}>
                {canAccess ? (
                  <Link href={`/learn/${course.id}`} className={`${rowBase} hover:bg-surface-2`}>
                    {body}
                  </Link>
                ) : previewable ? (
                  <button
                    type="button"
                    aria-pressed={activeId === lecture.id}
                    onClick={() => {
                      setActiveId(lecture.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`${rowBase} ${activeId === lecture.id ? "bg-t1" : "hover:bg-surface-2"}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className={rowBase} aria-label={`${lecture.lectureTitle}, locked`}>
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {hidden > 0 && (
        <Button
          variant="secondary"
          fullWidth
          leadingIcon={expanded ? "collapse-all" : "expand-all"}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="mt-6"
        >
          {expanded ? "Show fewer lectures" : `Show ${hidden} more ${hidden === 1 ? "lecture" : "lectures"}`}
        </Button>
      )}
    </section>
  );
}
