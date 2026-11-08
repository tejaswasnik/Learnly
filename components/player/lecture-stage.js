"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/client/api";
import { getYouTubeId } from "@/lib/shared/video";

/**
 * The video area for one lecture. Uploaded files use a native <video> (no download button, signed URL that is
 * refreshed on a media error); YouTube links use a sandboxed iframe; anything else is a plain link.
 */
export function LectureStage({ lecture, autoPlay, onEnded, onLectureUpdate }) {
  const videoRef = useRef(null);
  const retries = useRef(0);
  const [resume, setResume] = useState({ time: 0, playing: false });
  const [reloadKey, setReloadKey] = useState(0);
  const [failed, setFailed] = useState(false);
  const [lastLectureId, setLastLectureId] = useState(lecture.id);

  // New lecture: clear the failure and retry budget during render (not in an effect).
  if (lastLectureId !== lecture.id) {
    setLastLectureId(lecture.id);
    setFailed(false);
    setResume({ time: 0, playing: false });
  }
  useEffect(() => {
    retries.current = 0;
  }, [lecture.id]);

  // Signed URLs last an hour. Fetch a fresh one two minutes before expiry (immediately if it is already close),
  // so a long session or an old tab does not stall on an expired link. The new URL only applies to the next load.
  useEffect(() => {
    if (!lecture.videoUrlExpiresAt) return;
    const wait = Math.max(0, Date.parse(lecture.videoUrlExpiresAt) - Date.now() - 2 * 60 * 1000);
    const id = setTimeout(() => {
      api(`/lectures/${lecture.id}`)
        .then((res) => onLectureUpdate(res.lecture))
        .catch(() => {});
    }, wait);
    return () => clearTimeout(id);
  }, [lecture.id, lecture.videoUrlExpiresAt, onLectureUpdate]);

  async function refreshAndRetry(manual) {
    const video = videoRef.current;
    if (video) setResume({ time: video.currentTime || 0, playing: !video.paused });
    try {
      const res = await api(`/lectures/${lecture.id}`);
      onLectureUpdate(res.lecture);
      setFailed(false);
      setReloadKey((k) => k + 1);
    } catch {
      if (manual || retries.current >= 1) setFailed(true);
    }
  }

  function onVideoError() {
    // One automatic refresh (an expired signed URL is the usual cause); after that, show the failure state.
    if (retries.current >= 1) {
      setFailed(true);
      return;
    }
    retries.current += 1;
    refreshAndRetry(false);
  }

  if (lecture.isExternal) {
    const youtubeId = getYouTubeId(lecture.videoUrl);
    return (
      <div className="flex flex-col gap-4">
        <div className="relative aspect-video overflow-hidden rounded-base bg-t1">
          {youtubeId ? (
            <iframe
              key={lecture.id}
              title={lecture.lectureTitle}
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}${autoPlay ? "?autoplay=1" : ""}`}
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="autoplay; fullscreen"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="text-accent-light underline underline-offset-4">
                Open this lecture in a new tab
              </a>
            </div>
          )}
        </div>
        {youtubeId && <p className="text-muted">This lecture is hosted on YouTube. Playback controls come from the YouTube player.</p>}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-base bg-surface p-6 text-center">
        <Icon name="error-lg" size={48} />
        <h2 className="text-h3 text-ink">The video could not be loaded</h2>
        <p className="max-w-[420px] text-muted">Check your connection and try again.</p>
        <Button size="lg" leadingIcon="reload" onClick={() => refreshAndRetry(true)}>
          Reload video
        </Button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-base bg-black">
      <video
        key={`${lecture.id}-${reloadKey}`}
        ref={videoRef}
        src={lecture.videoUrl}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        playsInline
        autoPlay={autoPlay || resume.playing}
        aria-label={lecture.lectureTitle}
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => {
          if (resume.time > 0) e.currentTarget.currentTime = resume.time;
        }}
        onEnded={onEnded}
        onError={onVideoError}
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
