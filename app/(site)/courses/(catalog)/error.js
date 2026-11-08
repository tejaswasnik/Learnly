"use client";

import { RouteError } from "@/components/route-error";

export default function Error({ reset }) {
  return (
    <RouteError
      reset={reset}
      title="We couldn’t load the courses"
      message="The connection dropped before the list arrived. Your filters are saved, so try again."
    />
  );
}
