"use client";

import { RouteError } from "@/components/route-error";

export default function Error({ reset }) {
  return <RouteError reset={reset} title="We could not load this course" />;
}
