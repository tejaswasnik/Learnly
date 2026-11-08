"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { useAuth } from "@/components/providers";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { RadioCard } from "@/components/ui/radio-card";
import { TextField } from "@/components/ui/text-field";
import { GOOGLE_ERRORS } from "@/lib/shared/google-errors";
import { safeNext } from "@/lib/shared/safe-next";
import { loginSchema, registerSchema } from "@/lib/server/validators/auth";

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to pick up your courses where you left off.",
    submit: "Log in",
    alt: { text: "New to Learnly?", link: "Create an account", href: "/register" },
  },
  register: {
    title: "Join Learnly",
    subtitle: "Learn new skills or share your own.",
    submit: "Create account",
    alt: { text: "Already have an account?", link: "Log in", href: "/login" },
  },
};

function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) out[issue.path[0]] ??= issue.message;
  return out;
}

export function AuthScreen({ mode, next, email, googleEnabled = false, errorCode, children }) {
  const isRegister = mode === "register";
  const copy = COPY[mode];
  const router = useRouter();
  const { setUser } = useAuth();
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(GOOGLE_ERRORS[errorCode] ?? "");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("student");

  async function onSubmit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (isRegister) values.role = role;

    const parsed = (isRegister ? registerSchema : loginSchema).safeParse(values);
    if (!parsed.success) {
      setBanner("");
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBanner("");
    setLoading(true);
    try {
      const data = await api(`/auth/${mode}`, { method: "POST", body: parsed.data });
      setUser(data.user);
      const fallback = data.redirectTo ?? (data.user.role === "instructor" ? "/instructor/dashboard" : "/dashboard");
      router.replace(safeNext(next) ?? fallback);
      router.refresh();
    } catch (err) {
      setLoading(false);
      if (err.errors) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      } else if (err.status === 401) {
        setBanner(err.message);
      } else if (err.status === 409) {
        setErrors({ email: err.message });
      } else {
        toast.error(err.message);
      }
    }
  }

  const altHref = `${copy.alt.href}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-(--m) py-6 lg:p-8">
        {banner && (
          <p role="alert" className="mb-6 flex items-center gap-3 rounded-base bg-danger-tint px-4 py-3 font-semibold">
            <Icon name="error-banner" size={24} />
            {banner}
          </p>
        )}
        <Logo />

        <div className="flex flex-1 items-center justify-center py-12">
          <form onSubmit={onSubmit} noValidate className="flex w-full max-w-[440px] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-h1 text-ink">{copy.title}</h1>
              <p className="text-muted">{copy.subtitle}</p>
            </div>

            <div className="flex flex-col gap-6">
              {isRegister && (
                <TextField id="name" label="Full name" autoComplete="name" placeholder="Your name" error={errors.name} />
              )}
              <TextField
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                defaultValue={email}
                error={errors.email}
              />
              <TextField
                id="password"
                label="Password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                helper={isRegister ? "Use at least 8 characters." : undefined}
                error={errors.password}
              />
              {!isRegister && (
                <Link
                  href="/forgot-password"
                  className="-mt-3 inline-flex h-11 items-center self-start rounded-xs px-1 text-small font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent-light"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            {isRegister && (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-small text-ink">I want to</legend>
                <RadioCard
                  name="role"
                  value="student"
                  icon="choice-learn"
                  checked={role === "student"}
                  onChange={() => setRole("student")}
                  title="I want to learn"
                  description="Student: buy courses and watch every lecture."
                />
                <RadioCard
                  name="role"
                  value="instructor"
                  icon="choice-teach"
                  checked={role === "instructor"}
                  onChange={() => setRole("instructor")}
                  title="I want to teach"
                  description="Instructor: publish and manage courses."
                />
              </fieldset>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              {copy.submit}
            </Button>

            {googleEnabled && (
              <>
                <p aria-hidden="true" className="flex items-center gap-4 text-small text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                  or
                </p>
                <GoogleButton next={next} label={isRegister ? "Sign up with Google" : "Continue with Google"} />
              </>
            )}

            <p className="flex flex-wrap items-center gap-x-1 text-ink">
              {copy.alt.text}
              <Link
                href={altHref}
                className="inline-flex h-11 items-center rounded-xs px-1 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent-light"
              >
                {copy.alt.link}
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="hidden p-4 lg:sticky lg:top-0 lg:block lg:h-screen">{children}</div>
    </div>
  );
}
