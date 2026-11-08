import { AuthScreen } from "@/components/auth/auth-screen";
import { BrandPanel } from "@/components/auth/brand-panel";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <AuthScreen mode="login" next={typeof next === "string" ? next : undefined}>
      <BrandPanel heading="Learn one thing well." count={4} />
    </AuthScreen>
  );
}
