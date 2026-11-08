"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { deleteAccountSchema } from "@/lib/server/validators/user";

// The form owns its own state so typing never re-renders the modal shell (which would re-run its focus handling).
function DeleteForm({ role, onClose }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const parsed = deleteAccountSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]).reverse()));
      return;
    }
    setErrors({});
    setBanner("");
    setLoading(true);
    try {
      await api("/users/me", { method: "DELETE", body: parsed.data });
      setUser(null);
      notify.success("Account deleted", "Your personal details have been removed.");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setLoading(false);
      if (err.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      else setBanner(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p>
        This removes your name, email and sign-in. {role === "instructor" && "Your courses, lectures and videos are deleted. "}
        Purchase records are kept for accounting. This can’t be undone.
      </p>
      {banner && (
        <p role="alert" className="rounded-base bg-danger-tint px-4 py-3 font-semibold text-ink">
          {banner}
        </p>
      )}
      <PasswordField id="deletePassword" name="password" label="Your password" autoComplete="current-password" error={errors.password} />
      <TextField id="confirm" label="Type DELETE to confirm" autoComplete="off" error={errors.confirm} />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Delete my account
        </Button>
      </div>
    </form>
  );
}

export function DeleteAccount() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Admin accounts are managed in the database, not here.
  if (user.role === "admin") return null;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-danger/40 bg-surface p-6 md:p-8">
      <h2 className="text-h3 text-ink">Danger zone</h2>
      <p className="text-muted">
        Delete your account and personal details.{" "}
        {user.role === "instructor"
          ? "You can only do this if none of your courses has students; unpublish those instead."
          : "Your purchase records are kept for accounting."}
      </p>
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>
      <Modal open={open} title="Delete your account?" onClose={close}>
        <DeleteForm role={user.role} onClose={close} />
      </Modal>
    </section>
  );
}
