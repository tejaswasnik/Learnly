"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { groupLectures } from "@/lib/shared/curriculum";
import { formatClock } from "@/lib/shared/format";

const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-base hover:bg-border focus-visible:outline-2 focus-visible:outline-accent-light disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

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

// Owns its own field state so typing never re-renders the modal shell (which would re-run its focus handling).
function SectionDialog({ initialTitle = "", submitLabel, onSubmit, onClose }) {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }
    setError("");
    setSaving(true);
    const problem = await onSubmit(title.trim());
    if (problem) {
      setError(problem);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField id="sectionTitle" label="Section title" placeholder="e.g. Getting started" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} error={error} />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
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
  const [toDeleteSection, setToDeleteSection] = useState(null);
  const [deletingSection, setDeletingSection] = useState(false);
  const [dialog, setDialog] = useState(null); // { mode: "create" } | { mode: "rename", section }
  const [publishing, setPublishing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const movingRef = useRef(false);
  const focusRef = useRef(null);

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

  // After a move, keyboard focus follows the item (or its opposite button when it hit the end of the list).
  useEffect(() => {
    const target = focusRef.current;
    if (!target) return;
    focusRef.current = null;
    const pick = (dir) => document.querySelector(`[data-move="${target.key}-${dir}"]:not(:disabled)`);
    (pick(target.dir) ?? pick(target.dir === "up" ? "down" : "up"))?.focus();
  }, [course]);

  const closeDialog = useCallback(() => setDialog(null), []);

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

  async function confirmDeleteSection() {
    const section = toDeleteSection;
    setDeletingSection(true);
    try {
      const res = await api(`/sections/${section.id}`, { method: "DELETE" });
      notify.success("Section deleted", res.message);
      setNonce((n) => n + 1); // the lectures moved; reload the arrangement from the server
    } catch (err) {
      notify.error("Can’t delete this section", err.message);
    } finally {
      setDeletingSection(false);
      setToDeleteSection(null);
    }
  }

  async function saveSection(title) {
    try {
      if (dialog.mode === "create") {
        const res = await api("/sections/create", { method: "POST", body: { courseId, title } });
        setCourse((c) => ({ ...c, sections: [...c.sections, res.section] }));
        notify.success("Section added");
      } else {
        const res = await api(`/sections/update/${dialog.section.id}`, { method: "PATCH", body: { title } });
        setCourse((c) => ({ ...c, sections: c.sections.map((s) => (s.id === res.section.id ? res.section : s)) }));
        notify.success("Section renamed");
      }
      setDialog(null);
      return null;
    } catch (err) {
      return err.errors?.title?.[0] ?? err.message;
    }
  }

  // Sends the complete new arrangement. Updates the screen first and puts it back if the server refuses.
  async function commitOrder(nextSections, nextLectures, { key, dir, say }) {
    if (movingRef.current) return;
    movingRef.current = true;
    const before = course;
    focusRef.current = { key, dir };
    setCourse((c) => ({ ...c, sections: nextSections, lectures: nextLectures }));
    setAnnouncement(say);

    const groups = {};
    for (const g of groupLectures(nextLectures, nextSections)) groups[g.section ? g.section.id : "none"] = g.lectures.map((l) => l.id);
    groups.none ??= [];
    try {
      const res = await api("/lectures/reorder", { method: "POST", body: { courseId, sectionIds: nextSections.map((s) => s.id), groups } });
      setCourse((c) => ({ ...c, sections: res.sections, lectures: res.lectures }));
    } catch (err) {
      focusRef.current = null;
      setCourse(before);
      setAnnouncement("");
      notify.error("Couldn’t save the new order", err.message);
      if (err.status === 409) setNonce((n) => n + 1); // someone changed the course elsewhere: show the current state
    } finally {
      movingRef.current = false;
    }
  }

  function moveLecture(lecture, delta) {
    const groups = groupLectures(course.lectures, course.sections);
    const group = groups.find((g) => g.lectures.some((l) => l.id === lecture.id));
    const i = group.lectures.findIndex((l) => l.id === lecture.id);
    const j = i + delta;
    if (j < 0 || j >= group.lectures.length) return;
    const reordered = [...group.lectures];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    const flat = groups.flatMap((g) => (g === group ? reordered : g.lectures));
    commitOrder(course.sections, flat, {
      key: `lecture-${lecture.id}`,
      dir: delta < 0 ? "up" : "down",
      say: `Moved ${lecture.lectureTitle} ${delta < 0 ? "up" : "down"}. It is now ${j + 1} of ${group.lectures.length}${group.label ? ` in ${group.label}` : ""}.`,
    });
  }

  function moveSection(section, delta) {
    const i = course.sections.findIndex((s) => s.id === section.id);
    const j = i + delta;
    if (j < 0 || j >= course.sections.length) return;
    const nextSections = [...course.sections];
    [nextSections[i], nextSections[j]] = [nextSections[j], nextSections[i]];
    const flat = groupLectures(course.lectures, nextSections).flatMap((g) => g.lectures);
    commitOrder(nextSections, flat, {
      key: `section-${section.id}`,
      dir: delta < 0 ? "up" : "down",
      say: `Moved section ${section.title} ${delta < 0 ? "up" : "down"}. It is now section ${j + 1} of ${course.sections.length}.`,
    });
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

  const sections = course?.sections ?? [];
  const lectures = course?.lectures ?? [];
  const term = query.trim().toLowerCase();
  const searching = term.length > 0;
  const matches = (l) => !searching || l.lectureTitle.toLowerCase().includes(term);
  const shownCount = lectures.filter(matches).length;
  // While searching, groups with no match disappear and the move controls are hidden (a filtered view cannot be reordered).
  const groups = groupLectures(lectures, sections)
    .map((g) => ({ ...g, lectures: g.lectures.filter(matches) }))
    .filter((g) => !searching || g.lectures.length > 0);
  const previews = lectures.filter((l) => l.isPreviewFree).length;
  const lectureText = `${lectures.length} ${lectures.length === 1 ? "lecture" : "lectures"}`;
  const summary = searching
    ? `${shownCount} of ${lectureText}`
    : `${lectureText}${sections.length ? `, ${sections.length} ${sections.length === 1 ? "section" : "sections"}` : ""}${previews ? `, ${previews} free ${previews === 1 ? "preview" : "previews"}` : ""}`;

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
        <div className="flex flex-wrap gap-3">
          {course && (
            <Button variant="secondary" size="lg" leadingIcon="add" onClick={() => setDialog({ mode: "create" })}>
              Add section
            </Button>
          )}
          <ButtonLink href={`/courses/${courseId}/lectures/create`} size="lg" leadingIcon="add">
            Add lecture
          </ButtonLink>
        </div>
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
          <p role="status" className="sr-only">
            {announcement}
          </p>

          {lectures.length === 0 && sections.length === 0 ? (
            <div className="rounded-card bg-surface px-8 py-24">
              <EmptyState icon="videocam-md" title="No lectures yet" message="Add your first lecture. You can upload a video or paste a link, and group lectures into sections.">
                <ButtonLink href={`/courses/${courseId}/lectures/create`} leadingIcon="add-sm">
                  Add lecture
                </ButtonLink>
              </EmptyState>
            </div>
          ) : searching && groups.length === 0 ? (
            <div className="py-12">
              <EmptyState title="No lectures match" message="Try a different title, or clear the search.">
                <Button variant="secondary" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              </EmptyState>
            </div>
          ) : (
            <div className="flex flex-col gap-6 rounded-card bg-surface p-2">
              {groups.map((group) => {
                const section = group.section;
                const sectionIndex = section ? sections.findIndex((s) => s.id === section.id) : -1;
                return (
                  <section key={section?.id ?? "none"} aria-label={group.label ?? "Lectures"} className="flex flex-col gap-1">
                    {group.label && (
                      <header className="flex items-center gap-2 rounded-base bg-surface-2 py-1 pl-4 pr-1">
                        <h2 className="min-w-0 flex-1 truncate text-h3 text-ink">{group.label}</h2>
                        <span className="shrink-0 text-small text-muted">
                          {group.lectures.length} {group.lectures.length === 1 ? "lecture" : "lectures"}
                        </span>
                        {section && !searching && (
                          <>
                            <button
                              type="button"
                              data-move={`section-${section.id}-up`}
                              aria-label={`Move section ${section.title} up`}
                              disabled={sectionIndex === 0}
                              onClick={() => moveSection(section, -1)}
                              className={iconButton}
                            >
                              <Icon name="expand-less" size={20} className="text-ink" />
                            </button>
                            <button
                              type="button"
                              data-move={`section-${section.id}-down`}
                              aria-label={`Move section ${section.title} down`}
                              disabled={sectionIndex === sections.length - 1}
                              onClick={() => moveSection(section, 1)}
                              className={iconButton}
                            >
                              <Icon name="expand-more" size={20} className="text-ink" />
                            </button>
                            <button type="button" aria-label={`Rename section ${section.title}`} onClick={() => setDialog({ mode: "rename", section })} className={iconButton}>
                              <Icon name="edit-sm" size={20} />
                            </button>
                            <button type="button" aria-label={`Delete section ${section.title}`} onClick={() => setToDeleteSection(section)} className={iconButton}>
                              <Icon name="delete-row" size={20} />
                            </button>
                          </>
                        )}
                      </header>
                    )}
                    {group.lectures.length === 0 ? (
                      <p className="px-4 py-3 text-muted">No lectures in this section yet. Add one and choose this section.</p>
                    ) : (
                      <ol className="flex flex-col gap-1">
                        {group.lectures.map((lecture, i) => {
                          const index = lectures.findIndex((l) => l.id === lecture.id) + 1;
                          return (
                            <li key={lecture.id} className="flex min-h-16 items-center gap-2 rounded-base py-2 pl-4 pr-1 transition-colors hover:bg-surface-2 sm:gap-4">
                              <span className="w-7 shrink-0 text-small text-muted">{String(index).padStart(2, "0")}</span>
                              <span className="min-w-0 flex-1 truncate">{lecture.lectureTitle}</span>
                              {lecture.isPreviewFree && <Badge variant="free-preview" className="hidden sm:inline-flex" />}
                              <span className="shrink-0 text-small tabular-nums text-muted">{formatClock(lecture.duration)}</span>
                              {!searching && (
                                <>
                                  <button
                                    type="button"
                                    data-move={`lecture-${lecture.id}-up`}
                                    aria-label={`Move ${lecture.lectureTitle} up`}
                                    disabled={i === 0}
                                    onClick={() => moveLecture(lecture, -1)}
                                    className={iconButton}
                                  >
                                    <Icon name="expand-less" size={20} className="text-ink" />
                                  </button>
                                  <button
                                    type="button"
                                    data-move={`lecture-${lecture.id}-down`}
                                    aria-label={`Move ${lecture.lectureTitle} down`}
                                    disabled={i === group.lectures.length - 1}
                                    onClick={() => moveLecture(lecture, 1)}
                                    className={iconButton}
                                  >
                                    <Icon name="expand-more" size={20} className="text-ink" />
                                  </button>
                                </>
                              )}
                              <Link href={`/courses/${courseId}/lectures/edit/${lecture.id}`} aria-label={`Edit ${lecture.lectureTitle}`} className={iconButton}>
                                <Icon name="edit-sm" size={20} />
                              </Link>
                              <button type="button" aria-label={`Delete ${lecture.lectureTitle}`} onClick={() => setToDelete(lecture)} className={iconButton}>
                                <Icon name="delete-row" size={20} />
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>
                );
              })}
            </div>
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

      <Modal
        open={Boolean(toDeleteSection)}
        title="Delete this section?"
        onClose={() => !deletingSection && setToDeleteSection(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDeleteSection(null)} disabled={deletingSection}>
              Cancel
            </Button>
            <Button loading={deletingSection} onClick={confirmDeleteSection} leadingIcon="delete-sm" className="bg-danger text-field-ink hover:bg-danger/90">
              Delete section
            </Button>
          </>
        }
      >
        <p className="text-body">
          “{toDeleteSection?.title}” will be deleted. Its lectures are kept: they move to the end of the course under “Other lectures”.
        </p>
      </Modal>

      <Modal open={Boolean(dialog)} title={dialog?.mode === "rename" ? "Rename section" : "Add a section"} onClose={closeDialog}>
        {dialog && (
          <SectionDialog
            key={dialog.mode === "rename" ? dialog.section.id : "new"}
            initialTitle={dialog.mode === "rename" ? dialog.section.title : ""}
            submitLabel={dialog.mode === "rename" ? "Save" : "Add section"}
            onSubmit={saveSection}
            onClose={closeDialog}
          />
        )}
      </Modal>
    </main>
  );
}
