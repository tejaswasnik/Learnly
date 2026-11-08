import { AuthScreen } from "@/components/auth/auth-screen";
import { BrandPanel } from "@/components/auth/brand-panel";

export const metadata = { title: "Sign up" };

export default async function RegisterPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <AuthScreen mode="register" next={typeof next === "string" ? next : undefined}>
      <BrandPanel heading="Start learning, or start teaching." count={5} />
    </AuthScreen>
  );
}
