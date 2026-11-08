"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatBytes } from "@/lib/client/image-check";

function FileRow({ icon, name, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-base bg-surface-2">
        <Icon name={icon} size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        {children}
      </div>
    </div>
  );
}

function timeLeft(loaded, total, startedAt) {
  const elapsed = (Date.now() - startedAt) / 1000;
  if (elapsed < 3 || loaded <= 0) return "";
  const seconds = ((total - loaded) / loaded) * elapsed;
  if (seconds < 60) return ", less than a minute left";
  return `, about ${Math.round(seconds / 60)} minute${Math.round(seconds / 60) === 1 ? "" : "s"} left`;
}

/**
 * Video picker with the five states from the design: idle, uploading, done, failed (plus the dropzone's error text).
 * `upload` = { status, name, loaded, total, startedAt, durationText, error }.
 */
export function VideoUpload({ id, upload, onFile, onCancel, onRetry, onRemove, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const status = upload.status;

  const input = (
    <input
      ref={inputRef}
      id={id}
      type="file"
      accept="video/*"
      className="sr-only"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = "";
      }}
    />
  );

  if (status === "uploading") {
    const pct = upload.total ? Math.min(100, Math.round((upload.loaded / upload.total) * 100)) : 0;
    return (
      <div className="flex flex-col gap-4 rounded-base bg-surface p-4">
        {input}
        <FileRow icon="videocam-md" name={upload.name}>
          <p className="truncate text-small text-muted">
            {formatBytes(upload.loaded)} of {formatBytes(upload.total)}
            {timeLeft(upload.loaded, upload.total, upload.startedAt)}
          </p>
        </FileRow>
        <div
          role="progressbar"
          aria-label="Upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div className="h-2 bg-accent-light transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="font-semibold tabular-nums">{pct}%</p>
          <Button variant="ghost" leadingIcon="cancel" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex flex-col gap-4 rounded-base bg-surface p-4">
        {input}
        <FileRow icon="check-circle" name={upload.name}>
          <p className="flex items-center gap-1 text-small text-muted">
            <Icon name="schedule" size={16} />
            {upload.durationText}
          </p>
        </FileRow>
        <div>
          <Button variant="secondary" leadingIcon="replace-video" onClick={() => inputRef.current?.click()}>
            Replace video
          </Button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col gap-4 rounded-base border-2 border-danger bg-surface p-4">
        {input}
        <FileRow icon="error-md" name={upload.name}>
          <p role="alert" className="text-small text-danger">
            {upload.error || "Upload failed. Check your connection and retry."}
          </p>
        </FileRow>
        <div className="flex gap-3">
          <Button leadingIcon="retry" onClick={onRetry}>
            Retry upload
          </Button>
          <Button variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {input}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`flex flex-col items-center gap-4 rounded-base border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
          error ? "border-danger" : dragging ? "border-accent-light bg-t1" : "border-muted bg-surface hover:bg-surface-2"
        }`}
      >
        <Icon name="videocam-lg" size={40} />
        <span className="flex gap-1">
          <span>Drop a video or</span>
          <span className="font-semibold text-accent-light underline">browse</span>
        </span>
        <span className="text-small text-muted">MP4 or WebM, up to 500 MB</span>
      </button>
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-2 text-small text-danger">
          <Icon name="error-field" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
