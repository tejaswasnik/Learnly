import { AuthScreen } from "@/components/auth/auth-screen";
import { BrandPanel } from "@/components/auth/brand-panel";
import { googleEnabled } from "@/lib/server/google";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }) {
  const { next, error } = await searchParams;
  return (
    <AuthScreen mode="login" next={typeof next === "string" ? next : undefined} googleEnabled={googleEnabled()} errorCode={typeof error === "string" ? error : undefined}>
      <BrandPanel heading="Learn one thing well." count={4} />
    </AuthScreen>
  );
}
