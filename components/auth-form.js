"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { useAuth } from "@/components/providers";
import { safeNext } from "@/lib/shared/safe-next";
import { loginSchema, registerSchema } from "@/lib/server/validators/auth";

const inputClass =
  "w-full rounded-base bg-field px-3 py-2.5 text-field-ink placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5 aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-t5";

function Field({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-small text-muted">
        {label}
      </label>
      <input id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} {...props} />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-small text-t5">
          {error}
        </p>
      )}
    </div>
  );
}

function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) out[issue.path[0]] ??= issue.message;
  return out;
}

export function AuthForm({ mode, next }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { setUser } = useAuth();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("student");

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = Object.fromEntries(form);
    if (isRegister) values.role = role;

    const parsed = (isRegister ? registerSchema : loginSchema).safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const data = await api(`/auth/${mode}`, { method: "POST", body: parsed.data });
      setUser(data.user);
      const fallback = data.redirectTo ?? (data.user.role === "instructor" ? "/instructor/dashboard" : "/dashboard");
      router.replace(safeNext(next) ?? fallback);
      router.refresh();
    } catch (err) {
      if (err.errors) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      }
      toast.error(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {isRegister && <Field id="name" label="Full name" autoComplete="name" error={errors.name} />}
      <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email} />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        error={errors.password}
      />

      {isRegister && (
        <fieldset>
          <legend className="mb-1.5 text-small text-muted">I want to</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["student", "Learn"],
              ["instructor", "Teach"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-base border px-3 py-2.5 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-t5 ${
                  role === value ? "border-t4 bg-t1" : "border-surface-2 bg-surface hover:bg-surface-2"
                }`}
              >
                <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-base bg-accent px-4 py-3 font-medium text-accent-ink transition-colors hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5 disabled:opacity-60"
      >
        {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-small text-muted">
        {isRegister ? "Already have an account?" : "New to Learnly?"}{" "}
        <Link
          href={`${isRegister ? "/login" : "/register"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-ink underline underline-offset-4"
        >
          {isRegister ? "Log in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
