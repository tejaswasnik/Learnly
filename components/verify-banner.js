"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";

const COOLDOWN_SECONDS = 60;

/** Slim banner for signed-in users whose email is not verified yet. */
export function VerifyBanner() {
  const { user } = useAuth();
  const [wait, setWait] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  if (!user || user.emailVerified) return null;

  async function resend() {
    setSending(true);
    try {
      await api("/auth/resend-verification", { method: "POST" });
      notify.success("Email sent", `Check ${user.email} for the link.`);
      setWait(COOLDOWN_SECONDS);
    } catch (err) {
      notify.error("Couldn’t send the email", err.message);
      if (err.status === 429) setWait(COOLDOWN_SECONDS);
    } finally {
      setSending(false);
    }
  }

  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-surface-2 px-(--m) py-2 text-small text-ink">
      <p>
        Verify your email to buy courses or publish. We sent a link to <strong>{user.email}</strong>.
      </p>
      <Button variant="ghost" onClick={resend} loading={sending} disabled={wait > 0}>
        {wait > 0 ? `Resend in ${wait}s` : "Resend email"}
      </Button>
    </div>
  );
}
