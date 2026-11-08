"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { FieldError } from "@/components/ui/text-field";
import { checkImage, formatBytes } from "@/lib/client/image-check";

// Image picker with drag and drop. `file` is a newly chosen File; `existingUrl` is the saved image when editing.
export function FilePicker({ id, label, file, previewUrl, existingUrl, onSelect, onRemove, error, onInvalid }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [measured, setMeasured] = useState({ url: null, text: null });

  // Image dimensions are only known once the browser has decoded it, so they arrive via a callback.
  useEffect(() => {
    if (!previewUrl) return;
    const img = new window.Image();
    img.onload = () => setMeasured({ url: previewUrl, text: `${img.naturalWidth} by ${img.naturalHeight}` });
    img.src = previewUrl;
  }, [previewUrl]);
  const dims = measured.url === previewUrl ? measured.text : null;

  function accept(picked) {
    if (!picked) return;
    const problem = checkImage(picked);
    if (problem) {
      onInvalid(problem);
      return;
    }
    onSelect(picked);
  }

  const shown = previewUrl || existingUrl;
  const describedBy = error ? `${id}-error` : `${id}-helper`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small text-ink">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-describedby={describedBy}
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {shown ? (
        <>
          <div className="relative aspect-16/9 overflow-hidden rounded-base bg-t1">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview or saved ImageKit URL */}
            <img src={shown} alt="Course thumbnail preview" className="size-full object-cover" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-small text-ink">{file ? file.name : "Current thumbnail"}</p>
              {file && (
                <p className="text-caption text-muted">
                  {dims ? `${dims}, ` : ""}
                  {formatBytes(file.size)}
                </p>
              )}
            </div>
            <Button variant="secondary" leadingIcon="replace" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            {file && (
              <Button variant="ghost" leadingIcon="remove" onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
        </>
      ) : (
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
            accept(e.dataTransfer.files?.[0]);
          }}
          aria-describedby={describedBy}
          className={`flex aspect-16/9 w-full flex-col items-center justify-center gap-2 rounded-base border-2 border-dashed px-4 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
            error ? "border-danger" : dragging ? "border-accent-light bg-t1" : "border-muted bg-surface hover:bg-surface-2"
          }`}
        >
          <Icon name="image" size={40} />
          <span className="flex gap-1">
            <span>Drop an image or</span>
            <span className="font-semibold text-accent-light underline">browse</span>
          </span>
          <span className="text-small text-muted">16:9 image, 1280 by 720 or larger</span>
        </button>
      )}

      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : (
        <p id={`${id}-helper`} className="text-small text-muted">
          JPEG, PNG or WebP, up to 5 MB
        </p>
      )}
    </div>
  );
}
