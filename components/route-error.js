"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

// Inline error block (e.g. "We couldn't load the courses"), as in Catalog / Error.
export function RouteError({ reset, title = "Something went wrong", message = "We could not load this page. Try again in a moment." }) {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-6 px-(--m) py-24 text-center">
      <Icon name="error-banner" size={48} />
      <h1 className="text-h2 text-ink">{title}</h1>
      <p className="max-w-[480px] text-muted">{message}</p>
      <div className="flex gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" size="lg" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </main>
  );
}
