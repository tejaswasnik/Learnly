"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusPill } from "@/components/ui/status-pill";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { formatClock } from "@/lib/shared/format";

function Skeleton() {
  return (
    <ul aria-busy="true" aria-label="Loading lectures" className="flex flex-col gap-1 rounded-card bg-surface p-2">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-4 px-4 py-3.5">
          <div className="h-4 w-7 rounded-xs bg-surface-2" />
          <div className="h-4 flex-1 rounded-xs bg-surface-2" />
          <div className="size-11 rounded-base bg-surface-2" />
        </li>
      ))}
    </ul>
  );
}

export function LectureList({ courseId }) {
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api(`/courses/${courseId}`)
      .then((res) => {
        if (cancelled) return;
        if (!res.course.isOwner) {
          notify.error("You can only manage your own courses");
          router.replace("/instructor/dashboard");
          return;
        }
        setFailed(false);
        setCourse(res.course);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404 || err.status === 400 || err.status === 403) {
          notify.error("Can’t open this course", err.message);
          router.replace("/instructor/dashboard");
        } else setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, nonce, router]);

  async function confirmDelete() {
    const lecture = toDelete;
    setDeleting(true);
    try {
      await api(`/lectures/${lecture.id}`, { method: "DELETE" });
      setCourse((c) => ({ ...c, lectures: c.lectures.filter((l) => l.id !== lecture.id) }));
      notify.success("Lecture deleted");
    } catch (err) {
      notify.error("Can’t delete this lecture", err.message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const body = new FormData();
      body.append("isPublished", "true");
      await api(`/courses/update/${courseId}`, { method: "PATCH", body });
      setCourse((c) => ({ ...c, isPublished: true }));
      notify.success("Course published", "Learners can now find it in the catalog.");
    } catch (err) {
      notify.error("Can’t publish this course", err.message);
    } finally {
      setPublishing(false);
    }
  }

  if (failed) {
    return (
      <main className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-4 px-(--m) py-24 text-center">
        <Icon name="error-banner" size={48} />
        <h1 className="text-h2 text-ink">We couldn’t load the lectures</h1>
        <Button variant="secondary" onClick={() => setNonce((n) => n + 1)}>
          Try again
        </Button>
      </main>
    );
  }

  const lectures = course?.lectures ?? [];
  const term = query.trim().toLowerCase();
  const shown = term ? lectures.filter((l) => l.lectureTitle.toLowerCase().includes(term)) : lectures;
  const previews = lectures.filter((l) => l.isPreviewFree).length;
  const summary = term
    ? `${shown.length} of ${lectures.length} ${lectures.length === 1 ? "lecture" : "lectures"}`
    : `${lectures.length} ${lectures.length === 1 ? "lecture" : "lectures"}${previews ? `, ${previews} free ${previews === 1 ? "preview" : "previews"}` : ""}`;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-(--m) pb-24 pt-8 md:pt-12">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-small text-muted">
          <li>
            <Link href="/instructor/dashboard" className="rounded-xs hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-light">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="max-w-[28ch] truncate">{course?.courseTitle ?? "…"}</li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">Lectures</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <h1 className="min-w-0 text-h1 text-ink">{course?.courseTitle ?? "Lectures"}</h1>
          {course && <StatusPill published={course.isPublished} />}
        </div>
        <ButtonLink href={`/courses/${courseId}/lectures/create`} size="lg" leadingIcon="add">
          Add lecture
        </ButtonLink>
      </header>

      {!course ? (
        <Skeleton />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {lectures.length > 0 && (
              <div className="w-full md:w-[420px]">
                <label htmlFor="lecture-search" className="sr-only">
                  Search lectures
                </label>
                <div className="flex h-11 items-center gap-2 rounded-base bg-field pl-3 pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-light">
                  <Icon name="search" size={20} />
                  <input
                    id="lecture-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search lectures"
                    className="min-w-0 flex-1 bg-transparent text-body text-field-ink placeholder:text-field-muted focus:outline-none"
                  />
                </div>
              </div>
            )}
            <p aria-live="polite" className="text-muted md:ml-auto">
              {summary}
            </p>
          </div>

          {lectures.length === 0 ? (
            <div className="rounded-card bg-surface px-8 py-24">
              <EmptyState icon="videocam-md" title="No lectures yet" message="Add your first lecture. You can upload a video or paste a link.">
                <ButtonLink href={`/courses/${courseId}/lectures/create`} leadingIcon="add-sm">
                  Add lecture
                </ButtonLink>
              </EmptyState>
            </div>
          ) : shown.length === 0 ? (
            <div className="py-12">
              <EmptyState title="No lectures match" message="Try a different title, or clear the search.">
                <Button variant="secondary" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              </EmptyState>
            </div>
          ) : (
            <ol className="flex flex-col gap-1 rounded-card bg-surface p-2">
              {shown.map((lecture) => {
                const index = lectures.indexOf(lecture) + 1;
                return (
                  <li
                    key={lecture.id}
                    className="flex min-h-16 items-center gap-4 rounded-base py-2 pl-4 pr-1 transition-colors hover:bg-surface-2"
                  >
                    <span className="w-7 shrink-0 text-small text-muted">{String(index).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate">{lecture.lectureTitle}</span>
                    {lecture.isPreviewFree && <Badge variant="free-preview" className="hidden sm:inline-flex" />}
                    <span className="shrink-0 text-small tabular-nums text-muted">{formatClock(lecture.duration)}</span>
                    <Link
                      href={`/courses/${courseId}/lectures/edit/${lecture.id}`}
                      aria-label={`Edit ${lecture.lectureTitle}`}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-base hover:bg-border focus-visible:outline-2 focus-visible:outline-accent-light"
                    >
                      <Icon name="edit-sm" size={20} />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete ${lecture.lectureTitle}`}
                      onClick={() => setToDelete(lecture)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-base hover:bg-border focus-visible:outline-2 focus-visible:outline-accent-light"
                    >
                      <Icon name="delete-row" size={20} />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {!course.isPublished && lectures.length > 0 && (
            <section aria-labelledby="publish-heading" className="flex flex-col gap-4 rounded-card bg-t1 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <h2 id="publish-heading" className="text-h3 text-ink">
                  Ready to publish?
                </h2>
                <p>Learners can find and buy this course once it is published. You can still edit lectures afterwards.</p>
              </div>
              <Button size="lg" leadingIcon="publish" loading={publishing} onClick={publish} className="shrink-0">
                Publish course
              </Button>
            </section>
          )}
        </>
      )}

      <Modal
        open={Boolean(toDelete)}
        title="Delete this lecture?"
        onClose={() => !deleting && setToDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button loading={deleting} onClick={confirmDelete} leadingIcon="delete-sm" className="bg-danger text-field-ink hover:bg-danger/90">
              Delete lecture
            </Button>
          </>
        }
      >
        <p className="text-body">“{toDelete?.lectureTitle}” and its video will be permanently deleted. This can’t be undone.</p>
      </Modal>
    </main>
  );
}
