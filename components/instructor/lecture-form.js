"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { checkVideo, isAbort, readVideoDuration, uploadVideo } from "@/lib/client/video-upload";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextareaField } from "@/components/ui/form-fields";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TextField } from "@/components/ui/text-field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { VideoUpload } from "@/components/ui/video-upload";
import { formatClock } from "@/lib/shared/format";

const IDLE = { status: "idle" };

function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-6 rounded-card bg-surface p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-h3 text-ink">{title}</h2>
        <p className="text-small text-muted">{description}</p>
      </header>
      {children}
    </section>
  );
}

// `lecture` is the saved lecture when editing (as returned by GET /api/lectures/:id).
export function LectureForm({ course, lecture }) {
  const isEdit = Boolean(lecture);
  const router = useRouter();
  const backHref = `/courses/${course.id}/lectures`;

  const [title, setTitle] = useState(lecture?.lectureTitle ?? "");
  const [description, setDescription] = useState(lecture?.description ?? "");
  const [isPreviewFree, setIsPreviewFree] = useState(lecture?.isPreviewFree ?? false);
  const [sectionId, setSectionId] = useState(lecture?.sectionId ?? "");
  const sections = course.sections ?? [];
  const [mode, setMode] = useState(lecture && !lecture.isExternal ? "upload" : lecture ? "url" : "upload");
  const [videoUrl, setVideoUrl] = useState(lecture?.isExternal ? lecture.videoUrl : "");
  const [minutes, setMinutes] = useState(lecture?.isExternal ? String(Math.floor(lecture.duration / 60)) : "");
  const [seconds, setSeconds] = useState(lecture?.isExternal ? String(lecture.duration % 60) : "");
  // An uploaded lecture starts in "done" so Replace video is offered; fileId stays unset until a new upload succeeds.
  const [upload, setUpload] = useState(
    lecture && !lecture.isExternal
      ? { status: "done", name: "Current video", durationText: `Duration ${formatClock(lecture.duration)}`, duration: lecture.duration }
      : IDLE,
  );
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);
  // Typing in a field clears that field's error right away; the others stay until the next submit.
  const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  const abortRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function startUpload(file) {
    const problem = checkVideo(file);
    if (problem) {
      setErrors((e) => ({ ...e, video: problem }));
      return;
    }
    setErrors((e) => ({ ...e, video: undefined }));
    setBanner("");
    fileRef.current = file;
    const controller = new AbortController();
    abortRef.current = controller;
    setUpload({ status: "uploading", name: file.name, loaded: 0, total: file.size, startedAt: Date.now() });

    // The duration comes from the file itself; the upload runs alongside.
    const durationPromise = readVideoDuration(file).catch(() => null);
    try {
      const { fileId, filePath } = await uploadVideo({
        file,
        signal: controller.signal,
        onProgress: (loaded, total) => setUpload((u) => (u.status === "uploading" ? { ...u, loaded, total } : u)),
      });
      const duration = await durationPromise;
      setUpload({
        status: "done",
        name: file.name,
        fileId,
        filePath,
        duration: duration ?? 0,
        durationText: duration ? `Detected duration ${formatClock(duration)}` : "Duration could not be detected",
      });
      if (!duration) setErrors((e) => ({ ...e, duration: "We couldn’t read the length. Enter it below." }));
    } catch (err) {
      if (isAbort(err)) {
        setUpload(IDLE);
        return;
      }
      setUpload({
        status: "failed",
        name: file.name,
        error: err?.status === 403 || err?.status === 401 ? err.message : "Upload failed. Check your connection and retry.",
      });
    }
  }

  function cancelUpload() {
    abortRef.current?.abort();
  }

  function removeUpload() {
    fileRef.current = null;
    setUpload(IDLE);
  }

  function validate() {
    const found = {};
    if (title.trim().length < 2) found.lectureTitle = "Title must be at least 2 characters.";

    let duration = 0;
    if (mode === "upload") {
      if (upload.status === "uploading") found.video = "Wait for the upload to finish.";
      else if (upload.status !== "done") found.video = "Upload a video, or paste a video URL instead.";
      else duration = upload.duration ?? 0;
    } else {
      if (!z.url().safeParse(videoUrl.trim()).success) found.videoUrl = "Enter a valid URL, starting with https://.";
      const m = Number(minutes === "" ? 0 : minutes);
      const s = Number(seconds === "" ? 0 : seconds);
      if (!Number.isInteger(m) || m < 0) found.minutes = "Enter whole minutes.";
      if (!Number.isInteger(s) || s < 0 || s > 59) found.seconds = "Enter 0 to 59.";
      if (!found.minutes && !found.seconds) {
        duration = m * 60 + s;
        if (duration === 0) found.minutes = "Enter the video length.";
      }
    }
    return { found, duration };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBanner("");
    const { found, duration } = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = { lectureTitle: "lectureTitle", video: "video-file", videoUrl: "videoUrl", minutes: "minutes", seconds: "seconds" }[Object.keys(found)[0]];
      document.getElementById(first)?.focus();
      return;
    }
    setErrors({});

    const body = {
      lectureTitle: title.trim(),
      description: description.trim(),
      duration,
      isPreviewFree,
      sectionId: sectionId || null,
    };
    // Only send a video source when it is new or changed; the server swaps the old file out.
    if (mode === "upload" && upload.fileId) Object.assign(body, { fileId: upload.fileId, filePath: upload.filePath });
    if (mode === "url" && !(lecture?.isExternal && lecture.videoUrl === videoUrl.trim())) body.videoUrl = videoUrl.trim();

    setSaving(true);
    try {
      if (isEdit) await api(`/lectures/update/${lecture.id}`, { method: "PATCH", body });
      else await api("/lectures/create", { method: "POST", body: { ...body, courseId: course.id } });
      notify.success(isEdit ? "Lecture saved" : "Lecture added");
      router.push(backHref);
      router.refresh();
    } catch (err) {
      setSaving(false);
      if (err.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      const uploadedAlready = mode === "upload" && upload.fileId;
      setBanner(
        uploadedAlready
          ? "Your video uploaded, but we couldn’t save the lecture. Retry save. You don’t need to upload again."
          : `We couldn’t save the lecture. ${err.message}`,
      );
    }
  }

  const retryingSave = Boolean(banner) && mode === "upload" && Boolean(upload.fileId);

  return (
    <main className="mx-auto w-full max-w-[720px] px-(--m) pb-24 pt-8 md:pt-12">
      <header className="flex flex-col items-start gap-4">
        <ButtonLink href={backHref} variant="ghost" leadingIcon="chevron-left">
          Back
        </ButtonLink>
        <h1 className="text-h1 text-ink">{isEdit ? "Edit lecture" : "Add lecture"}</h1>
        <p className="text-muted">{course.courseTitle}</p>
      </header>

      {banner && (
        <p role="alert" className="mt-8 flex items-start gap-3 rounded-base bg-danger-tint px-4 py-3 font-semibold">
          <Icon name="error-banner" size={24} className="mt-0.5" />
          {banner}
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-6">
        <Section title="Lecture details" description="The title and description appear in the lecture list and on the player page.">
          <TextField
            id="lectureTitle"
            label="Lecture title"
            placeholder="e.g. Components and props"
            helper="Up to 120 characters."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError("lectureTitle");
            }}
            error={errors.lectureTitle}
            maxLength={120}
          />
          <TextareaField
            id="description"
            label="Description"
            placeholder="What does this lecture cover?"
            helper="Optional. Up to 2,000 characters."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            maxLength={2000}
          />
          {sections.length > 0 && (
            <SelectField
              id="sectionId"
              label="Section"
              helper={isEdit ? "Changing the section moves this lecture to the end of the new one." : "The lecture is added at the end of the section."}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              options={[{ value: "", label: "No section" }, ...sections.map((s) => ({ value: s.id, label: s.title }))]}
            />
          )}
        </Section>

        <Section title="Video" description="Upload a file or paste a link. Learners stream the lecture; they cannot download it.">
          <SegmentedControl
            label="Video source"
            value={mode}
            onChange={setMode}
            options={[
              { value: "upload", label: "Upload video" },
              { value: "url", label: "Paste video URL" },
            ]}
          />
          {mode === "upload" ? (
            <VideoUpload
              id="video-file"
              upload={upload}
              error={errors.video}
              onFile={startUpload}
              onCancel={cancelUpload}
              onRetry={() => fileRef.current && startUpload(fileRef.current)}
              onRemove={removeUpload}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <TextField
                id="videoUrl"
                label="Video URL"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                helper="YouTube and other links are supported."
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  clearError("videoUrl");
                }}
                error={errors.videoUrl}
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  id="minutes"
                  label="Minutes"
                  inputMode="numeric"
                  placeholder="0"
                  helper="Whole minutes."
                  value={minutes}
                  onChange={(e) => {
                    setMinutes(e.target.value);
                    clearError("minutes");
                  }}
                  error={errors.minutes}
                />
                <TextField
                  id="seconds"
                  label="Seconds"
                  inputMode="numeric"
                  placeholder="0"
                  helper="0 to 59."
                  value={seconds}
                  onChange={(e) => {
                    setSeconds(e.target.value);
                    clearError("seconds");
                  }}
                  error={errors.seconds}
                />
              </div>
            </div>
          )}
          {errors.duration && mode === "upload" && (
            <p role="alert" className="text-small text-danger">
              {errors.duration}
            </p>
          )}
        </Section>

        <section className="rounded-card bg-surface p-6 md:p-8">
          <ToggleSwitch
            checked={isPreviewFree}
            onChange={setIsPreviewFree}
            label="Free preview: anyone can watch this lecture before enrolling"
            className="items-center text-left"
          />
        </section>

        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
          <ButtonLink href={backHref} variant="ghost" size="lg">
            Cancel
          </ButtonLink>
          <Button type="submit" size="lg" loading={saving} disabled={upload.status === "uploading" && mode === "upload"}>
            {retryingSave ? "Retry save" : "Save lecture"}
          </Button>
        </div>
      </form>
    </main>
  );
}
