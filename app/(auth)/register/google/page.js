import { redirect } from "next/navigation";
import { GoogleRole } from "@/components/auth/google-role";
import { googleEnabled, readPendingSignup } from "@/lib/server/google";
import { safeNext } from "@/lib/shared/safe-next";

export const metadata = { title: "Finish signing up", robots: { index: false } };

// New people land here after Google, before the account exists, to pick Student or Instructor.
export default async function Page({ searchParams }) {
  if (!googleEnabled()) redirect("/register");
  const pending = await readPendingSignup();
  if (!pending) redirect("/login?error=google_expired");
  const { next } = await searchParams;
  return <GoogleRole name={pending.name || pending.email.split("@")[0]} email={pending.email} next={safeNext(typeof next === "string" ? next : null)} />;
}
