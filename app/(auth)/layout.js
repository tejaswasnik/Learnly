// Focused layout: no navbar or footer on login and register.
export default function AuthLayout({ children }) {
  return <main className="min-h-screen">{children}</main>;
}
