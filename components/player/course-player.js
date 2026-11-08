"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LectureStage } from "@/components/player/lecture-stage";
import { QaPanel } from "@/components/player/qa-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
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

// `completed` is a Set of lecture ids, or null when progress is not tracked (the course's own instructor).
function LectureList({ lectures, sections, activeId, onSelect, completed, onToggle }) {
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
              const done = completed?.has(l.id) ?? false;
              return (
                <li key={l.id} className="flex items-center gap-1">
                  {completed && (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      aria-label={`Mark ${l.lectureTitle} as complete`}
                      onClick={() => onToggle(l.id, !done)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-base hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-light"
                    >
                      <Icon name={done ? "complete-on" : "complete-off"} size={22} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelect(l.id)}
                    className={`flex min-h-16 min-w-0 flex-1 items-center gap-4 rounded-base px-4 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
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

const TABS = [
  ["overview", "Overview"],
  ["qa", "Q&A"],
];

// Standard tabs pattern: only the selected tab is in the tab order; left and right arrows move between tabs.
function Tabs({ tab, onChange, qaTotal }) {
  function onKeyDown(e) {
    const i = TABS.findIndex(([value]) => value === tab);
    const next = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : null;
    if (next === null) return;
    e.preventDefault();
    onChange(TABS[next][0]);
    document.getElementById(`tab-${TABS[next][0]}`)?.focus();
  }
  return (
    <div role="tablist" aria-label="Lecture details" onKeyDown={onKeyDown} className="flex gap-2 border-b border-border">
      {TABS.map(([value, label]) => (
        <button
          key={value}
          id={`tab-${value}`}
          type="button"
          role="tab"
          aria-selected={tab === value}
          aria-controls={`panel-${value}`}
          tabIndex={tab === value ? 0 : -1}
          onClick={() => onChange(value)}
          className={`-mb-px h-11 border-b-2 px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
            tab === value ? "border-accent-light font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {label}
          {value === "qa" && qaTotal !== null && <span className="ml-2 text-small text-muted">{qaTotal}</span>}
        </button>
      ))}
    </div>
  );
}

export function CoursePlayer({ courseId }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [lectures, setLectures] = useState(null);
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState(null); // null: not tracked (the course's own instructor or an admin)
  const [failedKey, setFailedKey] = useState(null);
  const [nonce, setNonce] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState("details");
  const [tab, setTab] = useState("overview");
  const [qaTotal, setQaTotal] = useState(null);
  const savedLast = useRef(null); // the lecture id the server already has as "last watched"
  const requestSeq = useRef(0); // so a slow response to an old tick cannot overwrite a newer one

  useEffect(() => {
    let cancelled = false;
    Promise.all([api(`/lectures/course/${courseId}`), api(`/courses/${courseId}`)])
      .then(([lectureRes, courseRes]) => {
        if (cancelled) return;
        setTitle(courseRes.course.courseTitle);
        setSections(lectureRes.sections ?? []);
        setLectures(lectureRes.lectures);
        setProgress(lectureRes.progress ?? null);
        savedLast.current = lectureRes.progress?.lastLectureId ?? null;
        // Resume where the student left off; a first visit (or a deleted lecture) starts at the top.
        setActiveId((current) => current ?? lectureRes.progress?.lastLectureId ?? lectureRes.lectures[0]?.id ?? null);
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

  const tracked = progress !== null;
  const completed = tracked ? new Set(progress.completedLectureIds) : null;

  // Ticks the lecture on screen at once and puts it back if the server says no.
  async function setCompleted(lectureId, value) {
    if (!progress || !lectures) return;
    const before = progress;
    const ids = new Set(progress.completedLectureIds);
    if (value) ids.add(lectureId);
    else ids.delete(lectureId);
    setProgress({
      ...progress,
      completedLectureIds: [...ids],
      completedCount: ids.size,
      percent: lectures.length ? Math.round((ids.size / lectures.length) * 100) : 0,
    });
    const seq = ++requestSeq.current;
    try {
      const res = await api(`/enrollments/${courseId}/progress`, { method: "PATCH", body: { lectureId, completed: value } });
      if (seq === requestSeq.current) setProgress(res.progress);
    } catch (err) {
      if (seq === requestSeq.current) setProgress(before);
      notify.error("Couldn’t save your progress", err.message);
    }
  }

  // Remember which lecture is open so the course reopens there. Waits a moment so skimming does not spam the server.
  useEffect(() => {
    if (!tracked || !activeId || activeId === savedLast.current) return;
    const timer = setTimeout(() => {
      savedLast.current = activeId;
      api(`/enrollments/${courseId}/progress`, { method: "PATCH", body: { lectureId: activeId, viewing: true } }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeId, tracked, courseId]);

  const index = lectures ? lectures.findIndex((l) => l.id === activeId) : -1;
  const lecture = index >= 0 ? lectures[index] : null;
  const previous = index > 0 ? lectures[index - 1] : null;
  const next = lectures && index >= 0 && index < lectures.length - 1 ? lectures[index + 1] : null;

  function select(id, { play = true } = {}) {
    setActiveId(id);
    setAutoPlay(play);
    setMobileTab("details");
    setQaTotal(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // A file that plays to the end counts as done. YouTube cannot tell us, so those rely on the checkbox.
  function onLectureEnded() {
    if (lecture && tracked && !lecture.isExternal && !completed.has(lecture.id)) setCompleted(lecture.id, true);
    if (next) select(next.id);
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

  const done = lecture ? (completed?.has(lecture.id) ?? false) : false;

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
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" leadingIcon="prev" disabled={!previous} onClick={() => previous && select(previous.id)}>
          Previous lecture
        </Button>
        <Button disabled={!next} onClick={() => next && select(next.id)}>
          Next lecture
          <Icon name="next" size={20} />
        </Button>
        {tracked && (
          <Button variant="secondary" leadingIcon={done ? "complete-on" : "complete-off"} aria-pressed={done} onClick={() => setCompleted(lecture.id, !done)}>
            {done ? "Completed" : "Mark as complete"}
          </Button>
        )}
      </div>

      <Tabs tab={tab} onChange={setTab} qaTotal={qaTotal} />
      <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={tab !== "overview"}>
        {lecture.description ? <p className="whitespace-pre-line">{lecture.description}</p> : <p className="text-muted">No description for this lecture.</p>}
      </div>
      <div id="panel-qa" role="tabpanel" aria-labelledby="tab-qa" hidden={tab !== "qa"}>
        {tab === "qa" && <QaPanel key={lecture.id} lectureId={lecture.id} onTotal={setQaTotal} />}
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
      {tracked && (
        <div className="flex flex-col gap-2">
          <p aria-live="polite" className="flex justify-between text-small text-muted">
            <span>
              {progress.completedCount} of {lectures.length} completed
            </span>
            <span className="tabular-nums">{progress.percent}%</span>
          </p>
          <ProgressBar percent={progress.percent} label="Course progress" />
        </div>
      )}
      <LectureList lectures={lectures} sections={sections} activeId={activeId} onSelect={(id) => select(id)} completed={completed} onToggle={setCompleted} />
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
            <LectureStage lecture={lecture} autoPlay={autoPlay} onEnded={onLectureEnded} onLectureUpdate={updateLecture} />

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
