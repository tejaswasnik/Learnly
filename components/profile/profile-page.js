"use client";

import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/components/providers";
import { Avatar } from "@/components/avatar";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { DeleteAccount } from "@/components/profile/delete-account";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { changePasswordSchema } from "@/lib/server/validators/auth";
import { updateNameSchema } from "@/lib/server/validators/user";

const ROLE_LABEL = { student: "Student", instructor: "Instructor", admin: "Admin" };

function Card({ title, children }) {
  return (
    <section className="flex flex-col gap-6 rounded-card bg-surface p-6 md:p-8">
      <h2 className="text-h3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function firstIssues(error) {
  const out = {};
  for (const issue of error.issues) out[issue.path[0]] ??= issue.message;
  return out;
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const nameChanged = name.trim() !== user.name;

  async function saveName(e) {
    e.preventDefault();
    const parsed = updateNameSchema.safeParse({ name });
    if (!parsed.success) {
      setNameError(parsed.error.issues[0].message);
      return;
    }
    setNameError("");
    setSavingName(true);
    try {
      const res = await api("/users/me", { method: "PATCH", body: parsed.data });
      setUser(res.user); // the navbar reads the same context, so it updates immediately
      setName(res.user.name);
      notify.success("Name updated");
    } catch (err) {
      setNameError(err.errors?.name?.[0] ?? err.message);
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    const base = changePasswordSchema.safeParse({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
    const found = base.success ? {} : firstIssues(base.error);
    if (!pw.currentPassword) found.currentPassword = "Enter your current password.";
    if (!found.newPassword && pw.confirm !== pw.newPassword) found.confirm = "The passwords don’t match.";
    if (Object.keys(found).length > 0) {
      setPwErrors(found);
      return;
    }
    setPwErrors({});
    setSavingPw(true);
    try {
      await api("/users/me/password", { method: "PATCH", body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      notify.success("Password updated", "Your other devices have been signed out.");
    } catch (err) {
      if (err.errors) setPwErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      else notify.error("Can’t update your password", err.message);
    } finally {
      setSavingPw(false);
    }
  }

  const setField = (key) => (e) => setPw((p) => ({ ...p, [key]: e.target.value }));

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-(--m) pb-24 pt-8 md:pt-16">
      <h1 className="text-h1 text-ink">Your profile</h1>

      <Card title="Account">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} photourl={user.photourl} size="lg" />
          <div className="flex flex-col gap-2">
            <p className="font-semibold">{user.name}</p>
            <span className="inline-flex w-fit items-center rounded-full bg-t1 px-3 py-1 text-small text-accent-light">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>
        </div>

        <AvatarUpload />

        <form onSubmit={saveName} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <TextField
              id="name"
              label="Full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              maxLength={80}
            />
          </div>
          <Button type="submit" loading={savingName} disabled={!nameChanged} className="sm:mt-[30px]">
            Save
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-small text-muted">
            Email address
          </label>
          <div className="flex h-12 items-center gap-3 rounded-base bg-surface-2 px-4">
            <Icon name="mail" size={20} />
            <input id="email" value={user.email} readOnly aria-describedby="email-note" className="min-w-0 flex-1 bg-transparent text-body text-muted focus:outline-none" />
          </div>
          <p id="email-note" className="text-small text-muted">
            Your email can’t be changed.
          </p>
        </div>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePassword} noValidate className="flex flex-col gap-6">
          <PasswordField
            id="currentPassword"
            label="Current password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={setField("currentPassword")}
            error={pwErrors.currentPassword}
          />
          <PasswordField
            id="newPassword"
            label="New password"
            autoComplete="new-password"
            helper="At least 8 characters"
            value={pw.newPassword}
            onChange={setField("newPassword")}
            error={pwErrors.newPassword}
          />
          <PasswordField
            id="confirm"
            label="Confirm new password"
            autoComplete="new-password"
            value={pw.confirm}
            onChange={setField("confirm")}
            error={pwErrors.confirm}
          />
          <p className="text-small text-muted">When you update your password, your other devices are signed out.</p>
          <div>
            <Button type="submit" loading={savingPw}>
              Update password
            </Button>
          </div>
        </form>
      </Card>

      <DeleteAccount />
    </main>
  );
}
