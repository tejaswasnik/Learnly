import { getConfig } from "@/lib/server/config";
import { HttpError } from "@/lib/server/http";

/**
 * Sends one email through Resend's REST API. With no API key (development only) the message is printed to the
 * server console instead, so links can be followed locally. Throws HttpError 502 when delivery fails; callers decide
 * whether that should fail the request.
 */
export async function sendEmail({ to, subject, html, text }) {
  const { RESEND_API_KEY, EMAIL_FROM } = getConfig();
  if (!RESEND_API_KEY) {
    console.log(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("Email delivery failed", err?.name);
    throw new HttpError(502, "We couldn’t send the email. Please try again.");
  }
  if (!res.ok) {
    console.error(`Email delivery failed with status ${res.status}`);
    throw new HttpError(502, "We couldn’t send the email. Please try again.");
  }
}
