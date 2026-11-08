"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CourseGridSkeleton } from "@/components/course-skeleton";
import { useAuth } from "@/components/providers";
import { EnrolledCourseCard } from "@/components/student/enrolled-course-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/client/api";

function greetingFor(date) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
const noSubscribe = () => () => {};

export function StudentDashboard() {
  const { user } = useAuth();
  // The greeting depends on the viewer's local clock: the server renders a neutral one, the browser the real one.
  const greeting = useSyncExternalStore(noSubscribe, () => greetingFor(new Date()), () => "Welcome back");
  const [data, setData] = useState(null);
  const [failedKey, setFailedKey] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api("/enrollments/me")
      .then((res) => !cancelled && setData(res.enrollments))
      .catch(() => !cancelled && setFailedKey(nonce));
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const error = failedKey === nonce && !data;
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-(--m) pb-24 pt-10 md:pt-16">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 text-ink">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-muted">Pick up where you left off.</p>
        </div>
        <div className="flex w-full flex-col gap-3 rounded-base bg-surface p-6 md:w-[260px]">
          <div className="flex items-center justify-between">
            <p className="text-small text-muted">Courses enrolled</p>
            <Icon name="stat-enrolled" size={24} />
          </div>
          {data ? (
            <p className="text-h2 tabular-nums text-ink">{data.length}</p>
          ) : (
            <div aria-hidden="true" className="h-10 w-16 animate-pulse rounded-xs bg-surface-2" />
          )}
        </div>
      </header>

      <section aria-labelledby="my-courses">
        <h2 id="my-courses" className="mb-6 text-h2 text-ink">
          My courses
        </h2>

        {error ? (
          <div className="flex flex-col items-center gap-6 rounded-card py-16 text-center">
            <Icon name="error-lg" size={48} />
            <h3 className="text-h2 text-ink">We couldn’t load your courses</h3>
            <p className="max-w-[480px] text-muted">The connection dropped before your courses arrived. Try again and they will be right here.</p>
            <Button size="lg" onClick={() => setNonce((n) => n + 1)}>
              Try again
            </Button>
          </div>
        ) : !data ? (
          <div aria-busy="true" aria-label="Loading your courses">
            <CourseGridSkeleton count={4} />
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-card bg-surface px-8 py-24">
            <EmptyState
              icon="school-empty"
              title="You are not enrolled in any course yet"
              message="Find a course in the catalog and it will show up here."
            >
              <ButtonLink href="/courses">Browse courses</ButtonLink>
            </EmptyState>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((e) => (
              <li key={e.course.id}>
                <EnrolledCourseCard course={e.course} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {!error && (
        <section aria-labelledby="discover" className="flex flex-col gap-6 rounded-card bg-surface p-6 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex flex-col gap-2">
            <h2 id="discover" className="text-h3 text-ink">
              Discover more
            </h2>
            <p className="text-muted">Browse the catalog for your next course in web, data, AI and design.</p>
          </div>
          <ButtonLink href="/courses" variant="secondary" size="lg" className="shrink-0">
            Browse courses
            <Icon name="arrow-forward" size={24} />
          </ButtonLink>
        </section>
      )}
    </main>
  );
}
