import { requirePageUser } from "@/lib/server/auth";

// Temporary: replaced by the real dashboards and profile in later prompts.
export async function Hello({ path = "/dashboard" }) {
  const user = await requirePageUser(path);
  return (
    <main className="mx-auto w-full max-w-[1440px] px-(--m) py-16">
      <h1 className="text-h1 text-ink">Hello {user.name}</h1>
    </main>
  );
}
