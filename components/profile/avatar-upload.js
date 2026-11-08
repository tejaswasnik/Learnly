"use client";

import { useId, useRef, useState } from "react";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { checkImage } from "@/lib/client/image-check";
import { notify } from "@/lib/client/notify";
import { hasCustomAvatar } from "@/lib/shared/avatar";

/** Change or remove the profile photo. The shared user is updated from the response, so the navbar changes at once. */
export function AvatarUpload() {
  const { user, setUser } = useAuth();
  const inputId = useId();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(null); // "upload" | "remove" | null

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // picking the same file again should still fire onChange
    if (!file) return;
    const problem = checkImage(file);
    if (problem) {
      notify.error("Can’t use this photo", problem);
      return;
    }
    setBusy("upload");
    try {
      const body = new FormData();
      body.append("avatar", file);
      const res = await api("/users/me", { method: "PATCH", body });
      setUser(res.user);
      notify.success("Photo updated");
    } catch (err) {
      notify.error("Couldn’t update your photo", err.message);
    } finally {
      setBusy(null);
    }
  }

  async function onRemove() {
    setBusy("remove");
    try {
      const res = await api("/users/me/avatar", { method: "DELETE" });
      setUser(res.user);
      notify.success("Photo removed");
    } catch (err) {
      notify.error("Couldn’t remove your photo", err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-describedby={`${inputId}-help`}
        onChange={onPick}
        disabled={busy !== null}
      />
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" loading={busy === "upload"} disabled={busy === "remove"} onClick={() => inputRef.current?.click()}>
          {hasCustomAvatar(user.photourl) ? "Change photo" : "Upload photo"}
        </Button>
        {hasCustomAvatar(user.photourl) && (
          <Button variant="ghost" loading={busy === "remove"} disabled={busy === "upload"} onClick={onRemove}>
            Remove photo
          </Button>
        )}
      </div>
      <p id={`${inputId}-help`} className="text-small text-muted">
        JPEG, PNG or WebP, up to 5 MB.
      </p>
    </div>
  );
}
