import { StatusPage } from "@/components/status-page";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Course not found" };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="We can’t find that course"
      message="It may have been removed, or it is not published yet. Browse the catalog to find something to learn."
    >
      <ButtonLink href="/courses" size="lg">
        Browse courses
      </ButtonLink>
      <ButtonLink href="/" size="lg" variant="secondary">
        Go home
      </ButtonLink>
    </StatusPage>
  );
}
