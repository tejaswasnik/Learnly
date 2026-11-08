"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CourseForm } from "@/components/instructor/course-form";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";

export function EditCourse({ courseId }) {
  const router = useRouter();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api(`/courses/${courseId}`)
      .then((res) => {
        if (cancelled) return;
        // The API also serves published courses to anyone, so check ownership here (the PATCH route enforces it too).
        if (!res.course.isOwner) {
          notify.error("You can only edit your own courses");
          router.replace("/instructor/dashboard");
          return;
        }
        setCourse(res.course);
      })
      .catch((err) => {
        if (cancelled) return;
        notify.error("Can’t open this course", err.message);
        router.replace("/instructor/dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, router]);

  if (!course) {
    return (
      <main aria-busy="true" className="mx-auto w-full max-w-[1440px] animate-pulse px-(--m) py-12">
        <div className="h-14 w-72 rounded-base bg-surface" />
        <div className="mt-8 h-96 rounded-card bg-surface" />
      </main>
    );
  }
  return <CourseForm course={course} />;
}
