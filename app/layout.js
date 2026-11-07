import localFont from "next/font/local";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { getCurrentUser, publicUser } from "@/lib/server/auth";
import "./globals.css";

const bricolage = localFont({
  src: "./fonts/bricolage.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

export const metadata = {
  title: "Learnly",
  description: "Learn from the best. Teach what you know.",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="min-h-screen">
        <Providers initialUser={user ? publicUser(user) : null}>
          <Navbar />
          {children}
        </Providers>
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
