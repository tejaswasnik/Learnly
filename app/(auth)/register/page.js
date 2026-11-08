import { AuthScreen } from "@/components/auth/auth-screen";
import { BrandPanel } from "@/components/auth/brand-panel";

export const metadata = { title: "Sign up" };

export default async function RegisterPage({ searchParams }) {
  const { next, email } = await searchParams;
  return (
    <AuthScreen mode="register" next={typeof next === "string" ? next : undefined}
      email={typeof email === "string" ? email.slice(0, 254) : undefined}
    >
      <BrandPanel heading="Start learning, or start teaching." count={5} />
    </AuthScreen>
  );
}
