"use client";

import Image from "next/image";
import { usePreview } from "@/components/course/preview-context";
import { Button } from "@/components/ui/button";
import { getYouTubeId } from "@/lib/shared/video";

function Player({ lecture }) {
  const youtubeId = lecture.isExternal ? getYouTubeId(lecture.videoUrl) : null;
  if (youtubeId) {
    return (
      <iframe
        title={`Preview: ${lecture.lectureTitle}`}
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="autoplay; fullscreen"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    );
  }
  if (lecture.isExternal) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-surface">
        <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="text-accent-light underline underline-offset-4">
          Open preview in a new tab
        </a>
      </div>
    );
  }
  return (
    <video
      controls
      autoPlay
      controlsList="nodownload"
      aria-label={`Preview: ${lecture.lectureTitle}`}
      src={lecture.videoUrl}
      className="absolute inset-0 size-full bg-black"
    />
  );
}

export function CourseMedia({ course }) {
  const { activeId, setActiveId } = usePreview();
  const active = course.lectures.find((l) => l.id === activeId && l.videoUrl);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-card bg-t1">
        {active ? (
          <Player key={active.id} lecture={active} />
        ) : (
          <Image
            src={course.courseThumbnail}
            alt={`${course.courseTitle} thumbnail`}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
      {active && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-small text-muted">Preview: {active.lectureTitle}</p>
          <Button variant="ghost" onClick={() => setActiveId(null)}>
            Close preview
          </Button>
        </div>
      )}
    </div>
  );
}
