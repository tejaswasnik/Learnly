"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LectureForm } from "@/components/instructor/lecture-form";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";

// Loads the course (and the lecture when editing), checks ownership, then renders the form.
export function LectureFormLoader({ courseId, lectureId }) {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api(`/courses/${courseId}`), lectureId ? api(`/lectures/${lectureId}`) : null])
      .then(([courseRes, lectureRes]) => {
        if (cancelled) return;
        if (!courseRes.course.isOwner) throw new Error("You can only manage your own courses");
        if (lectureRes && lectureRes.lecture.courseId !== courseId) throw new Error("Lecture not found");
        setData({ course: courseRes.course, lecture: lectureRes?.lecture ?? null });
      })
      .catch((err) => {
        if (cancelled) return;
        notify.error("Can’t open this page", err.message);
        router.replace("/instructor/dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, lectureId, router]);

  if (!data) {
    return (
      <main aria-busy="true" className="mx-auto w-full max-w-[720px] animate-pulse px-(--m) py-12">
        <div className="h-14 w-64 rounded-base bg-surface" />
        <div className="mt-8 h-80 rounded-card bg-surface" />
      </main>
    );
  }
  return <LectureForm course={data.course} lecture={data.lecture} />;
}
