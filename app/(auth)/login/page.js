import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md px-(--m) py-16">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Welcome back</h1>
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
