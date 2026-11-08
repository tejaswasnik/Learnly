import localFont from "next/font/local";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { siteUrl } from "@/lib/server/site-url";
import { getCurrentUser, publicUser } from "@/lib/server/auth";
import "./globals.css";

const bricolage = localFont({
  src: "./fonts/bricolage.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

const DESCRIPTION =
  "Learnly is a course marketplace: instructors publish video courses, students buy them with Razorpay and watch every lecture in one player.";

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Learnly", template: "%s · Learnly" },
  description: DESCRIPTION,
  openGraph: { siteName: "Learnly", type: "website", title: "Learnly", description: DESCRIPTION },
  twitter: { card: "summary" },
};

export default async function RootLayout({ children }) {
  // If the database is unreachable, public pages should still render (as signed out) instead of failing.
  const user = await getCurrentUser().catch(() => null);
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="min-h-screen">
        <Providers initialUser={user ? publicUser(user) : null}>{children}</Providers>
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
