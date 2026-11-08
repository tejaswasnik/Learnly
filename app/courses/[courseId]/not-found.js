import Link from "next/link";

export const metadata = { title: "Course not found" };

export default function NotFound() {
  return (
    <main className="mx-auto grid w-full max-w-7xl place-items-center px-(--m) py-24 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Course not found</h1>
        <p className="mt-3 text-muted">It may have been removed or is not published yet.</p>
        <Link
          href="/courses"
          className="mt-6 inline-block rounded-base bg-accent px-5 py-2.5 font-medium text-accent-ink hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
        >
          Browse courses
        </Link>
      </div>
    </main>
  );
}
