"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { Avatar } from "@/components/avatar";

const buttonBase =
  "inline-flex items-center rounded-base px-4 py-2 text-small font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dashboardHref = user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard";

  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("search")?.toString().trim();
    router.push(q ? `/courses?search=${encodeURIComponent(q)}` : "/courses");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-surface-2 bg-bg/90 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-(--m) py-3"
      >
        <Link href="/" className="text-xl font-bold tracking-tight">
          Learn<span className="text-t5">ly</span>
        </Link>
        <Link href="/courses" className="text-small text-muted transition-colors hover:text-ink">
          Courses
        </Link>

        <form onSubmit={onSearch} role="search" className="order-last w-full sm:order-none sm:ml-2 sm:w-auto sm:flex-1 sm:max-w-md">
          <label htmlFor="nav-search" className="sr-only">
            Search courses
          </label>
          <input
            id="nav-search"
            name="search"
            type="search"
            placeholder="Search courses"
            className="w-full rounded-base bg-surface px-3 py-2 text-small text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-t5"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
              >
                <Avatar name={user.name} src={user.photourl} />
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-base border border-surface-2 bg-surface py-1 text-small shadow-lg"
                >
                  <p className="truncate px-4 py-2 text-muted">{user.name}</p>
                  <Link role="menuitem" href={dashboardHref} onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-surface-2">
                    Dashboard
                  </Link>
                  <Link role="menuitem" href="/me" onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-surface-2">
                    Profile
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="block w-full px-4 py-2 text-left hover:bg-surface-2"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={`${buttonBase} text-ink hover:bg-surface`}>
                Log in
              </Link>
              <Link href="/register" className={`${buttonBase} bg-accent text-accent-ink hover:bg-accent-deep`}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
