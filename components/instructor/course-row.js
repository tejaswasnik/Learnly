"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { StatusPill } from "@/components/ui/status-pill";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { formatPrice } from "@/lib/shared/format";

function Stat({ value, label }) {
  return (
    <div className="flex min-w-[88px] flex-col gap-1">
      <p className="font-semibold tabular-nums">{value}</p>
      <p className="text-small text-muted">{label}</p>
    </div>
  );
}

function IconAction({ href, onClick, icon, label, tone }) {
  const cls = `group relative inline-flex size-11 items-center justify-center rounded-base bg-surface-2 transition-colors hover:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${tone ?? ""}`;
  const tip = (
    <span
      role="tooltip"
      className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-base bg-surface-2 px-3 py-2 text-small text-ink opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:hidden"
    >
      {label}
    </span>
  );
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      <Icon name={icon} size={24} />
      {tip}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      <Icon name={icon} size={24} />
      {tip}
    </button>
  );
}

export function CourseRow({ course, updating, onTogglePublish, onDelete }) {
  return (
    <li className="flex flex-col gap-4 rounded-card bg-surface p-3 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-6">
        <div className="relative h-[72px] w-32 shrink-0 overflow-hidden rounded-xs bg-t1">
          <Image src={course.courseThumbnail} alt="" fill sizes="128px" className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="line-clamp-2 font-semibold">{course.courseTitle}</p>
          <div>
            <StatusPill published={course.isPublished} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-1 lg:flex-nowrap lg:px-0">
        <Stat value={formatPrice(course.price.amount, course.price.currency)} label="Price" />
        <Stat value={course.enrolledCount.toLocaleString("en-US")} label="Students" />
        <Stat value={course.lectureCount.toLocaleString("en-US")} label="Lectures" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:justify-end lg:gap-6">
        <ToggleSwitch
          checked={course.isPublished}
          busy={updating}
          onChange={(next) => onTogglePublish(course, next)}
          label={course.isPublished ? "Published" : "Unpublished"}
          className="lg:w-[150px]"
        />
        <div className="flex gap-2 pr-3 lg:pr-3">
          <IconAction href={`/courses/edit/${course.id}`} icon="edit" label="Edit course" />
          <IconAction href={`/courses/${course.id}/lectures`} icon="videocam" label="Manage lectures" />
          <IconAction onClick={() => onDelete(course)} icon="delete" label="Delete course" />
        </div>
      </div>
    </li>
  );
}
