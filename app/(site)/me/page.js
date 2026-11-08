import { ProfilePage } from "@/components/profile/profile-page";
import { requirePageUser } from "@/lib/server/auth";

export const metadata = { title: "Your profile" };

export default async function Page() {
  // A signed but revoked session is cleared and sent to login instead of rendering a broken page.
  await requirePageUser("/me");
  return <ProfilePage />;
}
