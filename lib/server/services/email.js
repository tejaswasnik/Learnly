import nodemailer from "nodemailer";
import { getConfig } from "@/lib/server/config";
import { HttpError } from "@/lib/server/http";

let transporter;

// Gmail SMTP over implicit TLS. nodemailer exchanges the refresh token for short-lived access tokens itself,
// caches each one until it expires and refreshes it on demand, so nothing here handles tokens.
function getTransporter() {
  if (!transporter) {
    const { GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = getConfig();
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: GMAIL_USER,
        clientId: GMAIL_CLIENT_ID,
        clientSecret: GMAIL_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
      },
      // A slow or dead server must not hang the request that triggered the email.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

/**
 * Sends one email through Gmail (OAuth 2.0). With no Gmail credentials (development only; production requires
 * them) the message is printed to the server console instead, so links can be followed locally. Throws HttpError
 * 502 when delivery fails; callers decide whether that should fail the request.
 */
export async function sendEmail({ to, subject, html, text }) {
  const { GMAIL_USER, EMAIL_FROM } = getConfig();
  if (!GMAIL_USER) {
    console.log(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await getTransporter().sendMail({ from: EMAIL_FROM ?? `Learnly <${GMAIL_USER}>`, to, subject, html, text });
  } catch (err) {
    // Auth failures (most often "invalid_grant": the refresh token was revoked or expired) are what an operator
    // needs to see. Those messages come from Google's error reply and never contain our secrets.
    const detail = err?.code === "EOAUTH2" || err?.code === "EAUTH" ? String(err.message).slice(0, 200) : "";
    console.error("Email delivery failed", err?.code ?? err?.name, detail);
    throw new HttpError(502, "We couldn’t send the email. Please try again.");
  }
}
