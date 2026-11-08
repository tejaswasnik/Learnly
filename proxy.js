import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Next.js 16 renamed middleware.js to proxy.js; behaviour is the same.

const GUEST_ONLY = ["/login", "/register"];
const SIGNED_IN = ["/dashboard", "/learn", "/me"];
const INSTRUCTOR_ONLY = [/^\/instructor(\/|$)/, /^\/courses\/create(\/|$)/, /^\/courses\/edit(\/|$)/, /^\/courses\/[^/]+\/lectures(\/|$)/];

const startsWithSegment = (path, base) => path === base || path.startsWith(`${base}/`);

function homeFor(role) {
  return role === "instructor" ? "/instructor/dashboard" : "/dashboard";
}

async function readSession(req) {
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export async function proxy(req) {
  const { pathname, search } = req.nextUrl;
  const session = await readSession(req);
  const redirect = (to) => NextResponse.redirect(new URL(to, req.url));

  if (GUEST_ONLY.some((p) => startsWithSegment(pathname, p))) {
    return session ? redirect(homeFor(session.role)) : NextResponse.next();
  }

  const needsInstructor = INSTRUCTOR_ONLY.some((re) => re.test(pathname));
  const needsSession = needsInstructor || SIGNED_IN.some((p) => startsWithSegment(pathname, p));
  if (!needsSession) return NextResponse.next();

  if (!session) {
    const next = encodeURIComponent(pathname + search);
    return redirect(`/login?next=${next}`);
  }

  if (needsInstructor && session.role !== "instructor") return redirect(homeFor(session.role));
  // Student dashboard is for students (and admins); instructors have their own.
  if (startsWithSegment(pathname, "/dashboard") && session.role === "instructor") {
    return redirect(homeFor(session.role));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
