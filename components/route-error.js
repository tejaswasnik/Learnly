"use client";

export function RouteError({ reset, title = "Something went wrong" }) {
  return (
    <main className="mx-auto grid w-full max-w-7xl place-items-center px-(--m) py-24 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted">We could not load this page. Please try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-base bg-accent px-5 py-2.5 font-medium text-accent-ink hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
