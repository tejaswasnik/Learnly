import localFont from "next/font/local";
import { Toaster } from "sonner";
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="min-h-screen">
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
