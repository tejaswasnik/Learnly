"use client";

import { SiteShell } from "@/components/site-shell";
import { StatusPage } from "@/components/status-page";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ reset }) {
  return (
    <SiteShell>
      <StatusPage
        code="Oops"
        title="Something went wrong"
        message="An unexpected error stopped this page from loading. Try again, and if it keeps happening, come back in a few minutes."
      >
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" size="lg" variant="secondary">
          Go home
        </ButtonLink>
      </StatusPage>
    </SiteShell>
  );
}
