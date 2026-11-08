"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { api } from "@/lib/client/api";

/** Landing page for the emailed link: consumes the token once on mount and reports the result. */
export function VerifyEmail({ token }) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [state, setState] = useState(token ? { phase: "working" } : { phase: "error", message: "This link is invalid or has expired" });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return; // the link works once; do not spend it twice in dev double-render
    started.current = true;
    // Keep the token out of history and the address bar once read.
    window.history.replaceState(null, "", "/verify-email");
    api("/auth/verify-email", { method: "POST", body: { token } })
      .then((data) => {
        setState({ phase: "done" });
        setUser((current) => (current && current.id === data.user.id ? data.user : current));
        router.refresh();
      })
      .catch((err) => setState({ phase: "error", message: err.message }));
  }, [token, router, setUser]);

  const home = user ? (user.role === "instructor" ? "/instructor/dashboard" : "/dashboard") : "/login";

  return (
    <div className="flex min-h-screen flex-col px-(--m) py-6 lg:p-8">
      <Logo />
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex w-full max-w-[440px] flex-col gap-6" aria-live="polite">
          {state.phase === "working" && <h1 className="text-h1 text-ink">Verifying your email…</h1>}
          {state.phase === "done" && (
            <>
              <h1 className="text-h1 text-ink">Email verified</h1>
              <p className="text-muted">You can now buy courses and publish your own.</p>
              <ButtonLink href={home} size="lg">
                {user ? "Continue" : "Log in"}
              </ButtonLink>
            </>
          )}
          {state.phase === "error" && (
            <>
              <h1 className="text-h1 text-ink">Link not valid</h1>
              <p role="alert" className="text-muted">
                {state.message}
              </p>
              <p className="text-muted">Log in and use the banner at the top of the page to get a new link.</p>
              <ButtonLink href={home} size="lg">
                {user ? "Back to Learnly" : "Log in"}
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
