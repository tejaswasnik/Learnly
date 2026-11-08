import { VerifyEmail } from "@/components/auth/verify-email";

export const metadata = { title: "Verify your email", robots: { index: false } };

export default async function Page({ searchParams }) {
  const { token } = await searchParams;
  return <VerifyEmail token={typeof token === "string" ? token : ""} />;
}
