import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign up" };

export default async function RegisterPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md px-(--m) py-16">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Create your account</h1>
      <AuthForm mode="register" next={typeof next === "string" ? next : undefined} />
    </main>
  );
}
