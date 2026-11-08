"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { RadioCard } from "@/components/ui/radio-card";
import { api } from "@/lib/client/api";

/** One question for brand-new Google users: what do you want to do here? The account is created on submit. */
export function GoogleRole({ name, email, next }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/google/complete", { method: "POST", body: { role } });
      setUser(data.user);
      router.replace(next ?? data.redirectTo);
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-(--m) py-6 lg:p-8">
      <Logo />
      <div className="flex flex-1 items-center justify-center py-12">
        <form onSubmit={onSubmit} className="flex w-full max-w-[440px] flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-h1 text-ink">Welcome, {name}</h1>
            <p className="text-muted">
              You’re signing up with <strong className="text-ink">{email}</strong>. One more thing: how will you use Learnly?
            </p>
          </div>
          {error && (
            <p role="alert" className="rounded-base bg-danger-tint px-4 py-3 font-semibold">
              {error}
            </p>
          )}
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">I want to</legend>
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
          <Button type="submit" size="lg" fullWidth loading={loading}>
            Create my account
          </Button>
        </form>
      </div>
    </div>
  );
}
