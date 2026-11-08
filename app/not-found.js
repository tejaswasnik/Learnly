import { SiteShell } from "@/components/site-shell";
import { StatusPage } from "@/components/status-page";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <SiteShell>
      <StatusPage
        code="404"
        title="This page took a wrong turn"
        message="We can’t find what you were looking for. The link may be old, or the page has moved. Let’s get you back to learning."
      >
        <ButtonLink href="/" size="lg">
          Go home
        </ButtonLink>
        <ButtonLink href="/courses" size="lg" variant="secondary">
          Browse courses
        </ButtonLink>
      </StatusPage>
    </SiteShell>
  );
}
