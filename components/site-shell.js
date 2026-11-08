import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VerifyBanner } from "@/components/verify-banner";

// Navbar + Footer frame used by every screen except the focused layouts (login, register, player).
export function SiteShell({ children }) {
  return (
    <>
      <Navbar />
      <VerifyBanner />
      <div className="min-h-[calc(100vh-72px)]">{children}</div>
      <Footer />
    </>
  );
}
