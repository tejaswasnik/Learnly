import { ResetPassword } from "@/components/auth/recovery";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default async function Page({ searchParams }) {
  const { token } = await searchParams;
  return <ResetPassword token={typeof token === "string" ? token : ""} />;
}
