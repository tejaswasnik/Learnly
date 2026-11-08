import nodemailer from "nodemailer";
import { getConfig } from "@/lib/server/config";
import { HttpError } from "@/lib/server/http";

let transporter;

function getTransporter() {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = getConfig();
    const port = SMTP_PORT ?? 587;
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      // A slow or dead mail server must not hang the request that triggered the email.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

/**
 * Sends one email over SMTP with nodemailer. With no SMTP_HOST (development only; production requires it) the
 * message is printed to the server console instead, so links can be followed locally. Throws HttpError 502 when
 * delivery fails; callers decide whether that should fail the request.
 */
export async function sendEmail({ to, subject, html, text }) {
  const { SMTP_HOST, EMAIL_FROM } = getConfig();
  if (!SMTP_HOST) {
    console.log(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await getTransporter().sendMail({ from: EMAIL_FROM, to, subject, html, text });
  } catch (err) {
    // Log the code only: server responses can echo the address or credentials context.
    console.error("Email delivery failed", err?.code ?? err?.name, err?.responseCode ?? "");
    throw new HttpError(502, "We couldn’t send the email. Please try again.");
  }
}
