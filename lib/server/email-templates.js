import { getConfig } from "@/lib/server/config";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const link = (path, token) => `${getConfig().APP_URL.replace(/\/$/, "")}${path}?token=${encodeURIComponent(token)}`;

function layout({ name, intro, ctaLabel, ctaUrl, outro }) {
  const button = ctaUrl
    ? `<p><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#b11226;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeHtml(ctaLabel)}</a></p>
<p style="font-size:13px;color:#555">Or paste this link into your browser:<br>${escapeHtml(ctaUrl)}</p>`
    : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
<h2 style="margin:0 0 16px">Learnly</h2>
<p>Hi ${escapeHtml(name)},</p>
<p>${escapeHtml(intro)}</p>
${button}
<p style="font-size:13px;color:#555">${escapeHtml(outro)}</p>
</div>`;
  const text = [`Hi ${name},`, "", intro, ctaUrl ? `\n${ctaLabel}: ${ctaUrl}` : "", "", outro].join("\n");
  return { html, text };
}

export function verifyEmailMessage(user, token) {
  return {
    subject: "Verify your email for Learnly",
    ...layout({
      name: user.name,
      intro: "Confirm your email address to buy courses and publish your own. This link works once and expires in 24 hours.",
      ctaLabel: "Verify email",
      ctaUrl: link("/verify-email", token),
      outro: "If you didn’t create a Learnly account, you can ignore this email.",
    }),
  };
}

export function resetPasswordMessage(user, token) {
  return {
    subject: "Reset your Learnly password",
    ...layout({
      name: user.name,
      intro: "We got a request to reset your password. This link works once and expires in 1 hour.",
      ctaLabel: "Choose a new password",
      ctaUrl: link("/reset-password", token),
      outro: "If you didn’t ask for this, ignore this email. Your password stays as it is.",
    }),
  };
}

export function passwordChangedMessage(user) {
  return {
    subject: "Your Learnly password was changed",
    ...layout({
      name: user.name,
      intro: "Your password was just changed and every other session was signed out.",
      outro: "If this wasn’t you, reset your password right away from the login page.",
    }),
  };
}

export function accountDeletedMessage(user) {
  return {
    subject: "Your Learnly account was deleted",
    ...layout({
      name: user.name,
      intro: "Your account and personal details were removed. Purchase records are kept for accounting.",
      outro: "If you didn’t do this, contact support immediately.",
    }),
  };
}
