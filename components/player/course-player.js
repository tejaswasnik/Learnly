"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LectureStage } from "@/components/player/lecture-stage";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/client/api";
import { groupLectures } from "@/lib/shared/curriculum";
import { formatClock, formatTotalLength } from "@/lib/shared/format";

function PlayerSkeleton() {
  return (
    <div aria-busy="true" className="grid animate-pulse gap-6 px-(--m) py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="aspect-video rounded-base bg-surface" />
        <div className="h-10 w-2/5 rounded-xs bg-surface" />
        <div className="h-4 w-4/5 rounded-xs bg-surface" />
      </div>
      <div className="hidden space-y-3 rounded-card bg-surface p-6 lg:block">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-16 rounded-base bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

function LectureList({ lectures, sections, activeId, onSelect }) {
  const groups = groupLectures(lectures, sections).filter((g) => g.lectures.length > 0);
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.section?.id ?? "none"} className="flex flex-col gap-2">
          {group.label && <h3 className="px-1 text-body font-semibold text-ink">{group.label}</h3>}
          <ol className="flex flex-col gap-2">
      {group.lectures.map((l) => {
        const i = lectures.findIndex((x) => x.id === l.id);
        const active = l.id === activeId;
        return (
          <li key={l.id}>
            <button
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() => onSelect(l.id)}
              className={`flex min-h-16 w-full items-center gap-4 rounded-base px-4 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
                active ? "bg-t1" : "hover:bg-surface-2"
              }`}
            >
              <span className="w-7 shrink-0 text-small text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className={`flex size-7 shrink-0 items-center justify-center ${active ? "rounded-full bg-accent" : ""}`}>
                <Icon name={active ? "play-row-active" : "play-row"} size={active ? 18 : 20} />
              </span>
              <span className={`min-w-0 flex-1 ${active ? "font-semibold" : ""}`}>{l.lectureTitle}</span>
              <span className="shrink-0 text-small tabular-nums text-muted">{formatClock(l.duration)}</span>
            </button>
          </li>
        );
      })}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function CoursePlayer({ courseId }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [lectures, setLectures] = useState(null);
  const [sections, setSections] = useState([]);
  const [failedKey, setFailedKey] = useState(null);
  const [nonce, setNonce] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState("details");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api(`/lectures/course/${courseId}`), api(`/courses/${courseId}`)])
      .then(([lectureRes, courseRes]) => {
        if (cancelled) return;
        setTitle(courseRes.course.courseTitle);
        setSections(lectureRes.sections ?? []);
        setLectures(lectureRes.lectures);
        setActiveId((current) => current ?? lectureRes.lectures[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        // Not enrolled (or the course is gone): the course page is the place to enroll.
        if (err.status === 403 || err.status === 404 || err.status === 400) {
          router.replace(`/courses/${courseId}`);
          return;
        }
        setFailedKey(nonce);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, nonce, router]);

  const updateLecture = useCallback((fresh) => {
    setLectures((list) => list && list.map((l) => (l.id === fresh.id ? fresh : l)));
  }, []);

  const index = lectures ? lectures.findIndex((l) => l.id === activeId) : -1;
  const lecture = index >= 0 ? lectures[index] : null;
  const previous = index > 0 ? lectures[index - 1] : null;
  const next = lectures && index >= 0 && index < lectures.length - 1 ? lectures[index + 1] : null;

  function select(id, { play = true } = {}) {
    setActiveId(id);
    setAutoPlay(play);
    setMobileTab("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalSeconds = lectures ? lectures.reduce((sum, l) => sum + l.duration, 0) : 0;

  const topBar = (
    <header className="flex items-center gap-4 px-(--m) py-2">
      <ButtonLink href={`/courses/${courseId}`} variant="ghost" leadingIcon="back-course" className="shrink-0">
        <span className="max-sm:sr-only">Back to course</span>
      </ButtonLink>
      <p className="min-w-0 flex-1 truncate font-semibold">{title}</p>
    </header>
  );

  if (failedKey === nonce && !lectures) {
    return (
      <div className="min-h-screen bg-bg">
        {topBar}
        <main className="mx-auto flex max-w-[720px] flex-col items-center gap-4 px-(--m) py-24 text-center">
          <Icon name="error-lg" size={48} />
          <h1 className="text-h2 text-ink">We couldn’t load this course</h1>
          <p className="text-muted">Check your connection and try again.</p>
          <Button size="lg" onClick={() => setNonce((n) => n + 1)}>
            Try again
          </Button>
        </main>
      </div>
    );
  }

  if (!lectures) {
    return (
      <div className="min-h-screen bg-bg">
        {topBar}
        <PlayerSkeleton />
      </div>
    );
  }

  const details = lecture && (
    <section aria-labelledby="lecture-title" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 id="lecture-title" className="text-h2 text-ink">
            {lecture.lectureTitle}
          </h1>
          <p className="text-muted">
            Lecture {index + 1} of {lectures.length} · {formatClock(lecture.duration)}
          </p>
        </div>
        {!sidebarOpen && (
          <Button variant="secondary" className="hidden shrink-0 lg:inline-flex" onClick={() => setSidebarOpen(true)}>
            Course content
          </Button>
        )}
      </div>
      {lecture.description && <p className="whitespace-pre-line">{lecture.description}</p>}
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" leadingIcon="prev" disabled={!previous} onClick={() => previous && select(previous.id)}>
          Previous lecture
        </Button>
        <Button disabled={!next} onClick={() => next && select(next.id)}>
          Next lecture
          <Icon name="next" size={20} />
        </Button>
      </div>
    </section>
  );

  const content = (
    <aside
      aria-label="Course content"
      className="flex flex-col gap-6 rounded-card bg-surface p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 text-ink">Course content</h2>
          <p className="text-muted">
            {lectures.length} {lectures.length === 1 ? "lecture" : "lectures"} · {formatTotalLength(totalSeconds)}
          </p>
        </div>
        <Button
          variant="ghost"
          aria-expanded="true"
          onClick={() => setSidebarOpen(false)}
          className="hidden shrink-0 lg:inline-flex"
        >
          Hide
          <Icon name="hide-panel" size={20} />
        </Button>
      </div>
      <LectureList lectures={lectures} sections={sections} activeId={activeId} onSelect={(id) => select(id)} />
    </aside>
  );

  return (
    <div className="min-h-screen bg-bg">
      {topBar}
      {!lecture ? (
        <main className="mx-auto max-w-[720px] px-(--m) py-24 text-center">
          <h1 className="text-h2 text-ink">No lectures yet</h1>
          <p className="mt-3 text-muted">The instructor hasn’t added any lectures to this course yet.</p>
        </main>
      ) : (
        <main className={`grid gap-6 px-(--m) pb-16 pt-6 ${sidebarOpen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
          <div className="flex min-w-0 flex-col gap-6">
            <LectureStage
              lecture={lecture}
              autoPlay={autoPlay}
              onEnded={() => next && select(next.id)}
              onLectureUpdate={updateLecture}
            />

            {/* Phones: switch between the lecture's details and the lecture list. Desktop shows both. */}
            <div role="group" aria-label="View" className="flex gap-2 lg:hidden">
              {[
                ["details", "Details"],
                ["lectures", "Lectures"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mobileTab === value}
                  onClick={() => setMobileTab(value)}
                  className={`h-11 rounded-full px-4 text-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
                    mobileTab === value ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={mobileTab === "details" ? "" : "max-lg:hidden"}>{details}</div>
            <div className={`lg:hidden ${mobileTab === "lectures" ? "" : "hidden"}`}>{content}</div>
          </div>
          {sidebarOpen && <div className="hidden lg:block">{content}</div>}
        </main>
      )}
    </div>
  );
}
