"use client";

import { useEffect, useState } from "react";
import { CourseRow } from "@/components/instructor/course-row";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";

const PAGE_SIZE = 12;
const TABS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
];

function RowSkeleton() {
  return (
    <li aria-hidden="true" className="flex animate-pulse items-center gap-6 rounded-card bg-surface p-3">
      <div className="h-[72px] w-32 shrink-0 rounded-xs bg-surface-2" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-2/3 rounded-xs bg-surface-2" />
        <div className="h-4 w-20 rounded-xs bg-surface-2" />
      </div>
      <div className="hidden h-11 w-72 rounded-base bg-surface-2 lg:block" />
    </li>
  );
}

export function InstructorDashboard() {
  const [tab, setTab] = useState("all");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null); // { key, courses, page, totalPages, total, totals }
  const [failedKey, setFailedKey] = useState(null);
  const [nonce, setNonce] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updating, setUpdating] = useState(() => new Set());
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSearch(input.trim()), 500);
    return () => clearTimeout(id);
  }, [input]);

  // Everything that changes the result set lives in `key`; loading and error are derived from it.
  const key = `${tab}|${search}|${nonce}`;
  const loading = !data || data.key !== key;
  const error = failedKey === key;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ status: tab, page: "1", limit: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    api(`/courses/instructor/courses?${params}`)
      .then((res) => !cancelled && setData({ ...res, key }))
      .catch(() => !cancelled && setFailedKey(key));
    return () => {
      cancelled = true;
    };
  }, [key, tab, search]);

  async function loadMore() {
    if (!data) return;
    const { key: forKey, page } = data;
    const params = new URLSearchParams({ status: tab, page: String(page + 1), limit: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    setLoadingMore(true);
    try {
      const res = await api(`/courses/instructor/courses?${params}`);
      setData((prev) => (prev && prev.key === forKey ? { ...res, key: forKey, courses: [...prev.courses, ...res.courses] } : prev));
    } catch (err) {
      notify.error("Can’t load more courses", err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  const adjustTotals = (patch) =>
    setData((d) => (d ? { ...d, totals: { ...d.totals, ...patch(d.totals) } } : d));

  async function togglePublish(course, next) {
    const previous = course.isPublished;
    setUpdating((s) => new Set(s).add(course.id));
    // Optimistic update, rolled back if the server says no.
    setData((d) => d && { ...d, courses: d.courses.map((c) => (c.id === course.id ? { ...c, isPublished: next } : c)) });
    adjustTotals((t) => ({ published: t.published + (next ? 1 : -1) }));
    try {
      const body = new FormData();
      body.append("isPublished", String(next));
      await api(`/courses/update/${course.id}`, { method: "PATCH", body });
      if (tab !== "all") setNonce((n) => n + 1); // the course may no longer belong in this tab
    } catch (err) {
      setData((d) => d && { ...d, courses: d.courses.map((c) => (c.id === course.id ? { ...c, isPublished: previous } : c)) });
      adjustTotals((t) => ({ published: t.published + (next ? -1 : 1) }));
      notify.error(next ? "Can’t publish this course" : "Can’t unpublish this course", err.message);
    } finally {
      setUpdating((s) => {
        const copy = new Set(s);
        copy.delete(course.id);
        return copy;
      });
    }
  }

  async function confirmDelete() {
    const course = toDelete;
    setDeleting(true);
    try {
      await api(`/courses/${course.id}`, { method: "DELETE" });
      setData((d) => d && { ...d, courses: d.courses.filter((c) => c.id !== course.id), total: d.total - 1 });
      adjustTotals((t) => ({
        courses: t.courses - 1,
        published: t.published - (course.isPublished ? 1 : 0),
        students: t.students - course.enrolledCount,
      }));
      notify.success("Course deleted");
    } catch (err) {
      notify.error("Can’t delete this course", err.message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  function onTabKey(e) {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = TABS[(next + TABS.length) % TABS.length];
    setTab(target.id);
    document.getElementById(`tab-${target.id}`)?.focus();
  }

  const totals = data?.totals;
  const counts = totals ? { all: totals.courses, published: totals.published, draft: totals.courses - totals.published } : null;
  const hasAny = totals ? totals.courses > 0 : true;
  const filtered = tab !== "all" || search !== "";
  const hasMore = data ? data.page < data.totalPages : false;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-(--m) pb-24 pt-8 md:pt-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1 text-ink">Your courses</h1>
        <ButtonLink href="/courses/create" size="lg" leadingIcon="add">
          Create course
        </ButtonLink>
      </header>

      <section aria-label="Totals" className="grid gap-6 md:grid-cols-3">
        <StatCard label="Total courses" value={totals ? totals.courses.toLocaleString("en-US") : "–"} icon="stat-courses" />
        <StatCard label="Published" value={totals ? totals.published.toLocaleString("en-US") : "–"} icon="stat-published" />
        <StatCard label="Total students" value={totals ? totals.students.toLocaleString("en-US") : "–"} icon="stat-students" />
      </section>

      {hasAny && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Filter courses" onKeyDown={onTabKey} className="flex overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  className={`flex h-12 shrink-0 items-center gap-2 border-b-[3px] px-4 focus-visible:outline-2 focus-visible:outline-accent-light ${
                    active ? "border-accent-light font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                  <span className={`rounded-full px-2 py-1 text-caption ${active ? "bg-t2 text-ink" : "bg-surface-2 text-muted"}`}>
                    {counts ? counts[t.id] : "–"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="w-full md:w-[360px]">
            <label htmlFor="instructor-search" className="sr-only">
              Search your courses
            </label>
            <div className="flex h-11 items-center gap-2 rounded-base bg-field pl-3 pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-light">
              <Icon name="search" size={20} />
              <input
                id="instructor-search"
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search your courses"
                className="min-w-0 flex-1 bg-transparent text-body text-field-ink placeholder:text-field-muted focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {!data && !error ? (
        <ul aria-busy="true" aria-label="Loading courses" className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <RowSkeleton key={i} />
          ))}
        </ul>
      ) : error && !data ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Icon name="error-banner" size={48} />
          <h2 className="text-h3 text-ink">We couldn’t load your courses</h2>
          <Button variant="secondary" onClick={() => setNonce((n) => n + 1)}>
            Try again
          </Button>
        </div>
      ) : !hasAny ? (
        <div className="rounded-card bg-surface px-8 py-24">
          <EmptyState
            icon="school-empty"
            title="You have not created a course yet"
            message="Publish your first course and start earning from every sale."
          >
            <ButtonLink href="/courses/create" leadingIcon="add-sm">
              Create your first course
            </ButtonLink>
          </EmptyState>
        </div>
      ) : data.courses.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="No courses match"
            message={filtered ? "Try a different tab or clear the search." : "Nothing to show yet."}
          >
            {filtered && (
              <Button
                variant="secondary"
                onClick={() => {
                  setTab("all");
                  setInput("");
                }}
              >
                Clear filters
              </Button>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <ul className={`flex flex-col gap-3 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {data.courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                updating={updating.has(course.id)}
                onTogglePublish={togglePublish}
                onDelete={setToDelete}
              />
            ))}
          </ul>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" size="lg" loading={loadingMore} onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(toDelete)}
        title="Delete this course?"
        onClose={() => !deleting && setToDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              loading={deleting}
              onClick={confirmDelete}
              leadingIcon="delete-sm"
              className="bg-danger text-field-ink hover:bg-danger/90"
            >
              Delete course
            </Button>
          </>
        }
      >
        <p className="text-body">
          “{toDelete?.courseTitle}” and its lectures will be permanently deleted. This can’t be undone.
        </p>
      </Modal>
    </main>
  );
}
