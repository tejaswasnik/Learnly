// Full-page status screen used by 404 and the global error boundary ("15 404" in Figma).
export function StatusPage({ code, title, message, children }) {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-6 px-(--m) py-16 text-center md:py-24">
      <p aria-hidden="true" className="text-[clamp(120px,22vw,320px)] font-semibold leading-none tracking-[-0.04em] text-accent-light">
        {code}
      </p>
      <h1 className="text-h1 text-ink">{title}</h1>
      <p className="max-w-[760px] text-lead text-muted">{message}</p>
      <div className="mt-2 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">{children}</div>
    </main>
  );
}
