"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

const navLink =
  "inline-flex h-11 items-center rounded-xs px-3 text-body text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-light";

function SearchBox({ onDone }) {
  const router = useRouter();

  function onSubmit(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("search")?.toString().trim();
    router.push(q ? `/courses?search=${encodeURIComponent(q)}` : "/courses");
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <label htmlFor="nav-search" className="sr-only">
        Search courses
      </label>
      <div className="flex h-11 items-center gap-2 rounded-base bg-field pl-3 pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-light">
        <Icon name="search" size={20} />
        <input
          id="nav-search"
          name="search"
          type="search"
          autoComplete="off"
          placeholder="Search courses"
          className="min-w-0 flex-1 bg-transparent text-body text-field-ink placeholder:text-field-muted focus:outline-none"
        />
      </div>
    </form>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dashboardHref = user.role === "instructor" ? "/instructor/dashboard" : "/dashboard";

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block w-full px-4 py-3 text-left text-body hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
      >
        <Avatar name={user.name} photourl={user.photourl} size="md" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-base border border-border bg-surface py-1 shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-small text-muted">{user.email}</p>
          </div>
          <Link role="menuitem" href={dashboardHref} onClick={() => setOpen(false)} className={item}>
            Dashboard
          </Link>
          <Link role="menuitem" href="/me" onClick={() => setOpen(false)} className={item}>
            Profile
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={item}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuFor, setMenuFor] = useState(null);
  const menuOpen = menuFor === pathname;
  const dashboardHref = user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 bg-bg">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-(--m) md:h-[72px]">
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <Logo />
          <Link href="/courses" className={`${navLink} hidden md:inline-flex`}>
            Courses
          </Link>
        </div>

        <div className="hidden w-[360px] md:block">
          <SearchBox />
        </div>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                Log in
              </ButtonLink>
              <ButtonLink href="/register">Sign up</ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuFor(menuOpen ? null : pathname)}
          className="inline-flex size-11 items-center justify-center rounded-base hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-light md:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="space-y-4 border-t border-border px-(--m) pb-6 pt-4 md:hidden">
          <SearchBox onDone={() => setMenuFor(null)} />
          <Link href="/courses" className={`${navLink} w-full`}>
            Courses
          </Link>
          {user ? (
            <div className="space-y-1">
              <p className="px-3 text-small text-muted">{user.name}</p>
              <Link href={dashboardHref} className={`${navLink} w-full`}>
                Dashboard
              </Link>
              <Link href="/me" className={`${navLink} w-full`}>
                Profile
              </Link>
              <button type="button" onClick={logout} className={`${navLink} w-full`}>
                Log out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href="/login" variant="secondary">
                Log in
              </ButtonLink>
              <ButtonLink href="/register">Sign up</ButtonLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
