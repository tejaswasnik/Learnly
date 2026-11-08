"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { api } from "@/lib/client/api";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/server/validators/auth";

function Shell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col px-(--m) py-6 lg:p-8">
      <Logo />
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="flex w-full max-w-[440px] flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-h1 text-ink">{title}</h1>
            {subtitle && <p className="text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

const backLink =
  "inline-flex h-11 items-center self-start rounded-xs px-1 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent-light";

const firstErrors = (error) => Object.fromEntries(error.issues.map((i) => [i.path[0], i.message]).reverse());

export function ForgotPassword() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(firstErrors(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const data = await api("/auth/forgot-password", { method: "POST", body: parsed.data });
      setSent({ email: parsed.data.email, message: data.message });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Shell title="Check your email" subtitle={sent.message}>
        <p className="text-muted">The link expires in 1 hour and works once. Nothing arrived? Check spam, or try again.</p>
        <Link href="/login" className={backLink}>
          Back to log in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell title="Forgot your password?" subtitle="Enter your email and we’ll send you a link to choose a new one.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <TextField id="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email} />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Send reset link
        </Button>
        <Link href="/login" className={backLink}>
          Back to log in
        </Link>
      </form>
    </Shell>
  );
}

export function ResetPassword({ token: initialToken }) {
  const router = useRouter();
  const [token] = useState(initialToken);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep the token out of the address bar and history once the page has it.
  useEffect(() => {
    if (token) window.history.replaceState(null, "", "/reset-password");
  }, [token]);

  if (!token) {
    return (
      <Shell title="Link not valid" subtitle="This reset link is missing or has expired.">
        <Link href="/forgot-password" className={backLink}>
          Get a new link
        </Link>
      </Shell>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.newPassword !== values.confirm) return setErrors({ confirm: "Passwords don’t match" });
    const parsed = resetPasswordSchema.safeParse({ token, newPassword: values.newPassword });
    if (!parsed.success) return setErrors(firstErrors(parsed.error));
    setErrors({});
    setBanner("");
    setLoading(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: parsed.data });
      toast.success("Password updated. Log in with your new password.");
      router.replace("/login");
    } catch (err) {
      setLoading(false);
      if (err.errors?.newPassword) setErrors({ newPassword: err.errors.newPassword[0] });
      else setBanner(err.message);
    }
  }

  return (
    <Shell title="Choose a new password" subtitle="You’ll be signed out everywhere and asked to log in again.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        {banner && (
          <p role="alert" className="rounded-base bg-danger-tint px-4 py-3 font-semibold">
            {banner}{" "}
            <Link href="/forgot-password" className="underline underline-offset-4">
              Get a new link
            </Link>
          </p>
        )}
        <PasswordField id="newPassword" label="New password" autoComplete="new-password" helper="Use at least 8 characters." error={errors.newPassword} />
        <PasswordField id="confirm" label="Confirm new password" autoComplete="new-password" error={errors.confirm} />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Update password
        </Button>
      </form>
    </Shell>
  );
}
