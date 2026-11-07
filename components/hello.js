import { getCurrentUser } from "@/lib/server/auth";

// Temporary: replaced by the real dashboards and profile in later prompts.
export async function Hello() {
  const user = await getCurrentUser();
  return (
    <main className="mx-auto w-full max-w-7xl px-(--m) py-16">
      <h1 className="text-4xl font-bold tracking-tight">Hello {user?.name}</h1>
    </main>
  );
}
