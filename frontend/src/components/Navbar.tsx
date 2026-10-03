"use client";

import { Bell, LayoutDashboard, LogOut, Settings, ShieldCheck, ClipboardCheck, X } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AppNotification, Paginated } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = () =>
      api
        .get<Paginated<AppNotification> & { unread: number }>("/notifications/")
        .then((d) => !cancelled && setUnread(d.unread))
        .catch(() => {});
    load();
    const id = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, pathname]);

  const icon = "h-4 w-4";
  const isStaff = user && user.role !== "student";
  const links: NavLink[] = !user
    ? []
    : isStaff
      ? [
          { href: "/admin/dashboard", label: "Clearances", icon: <ClipboardCheck className={icon} /> },
          ...(user.role === "super_admin"
            ? [{ href: "/admin/settings", label: "Settings", icon: <Settings className={icon} /> }]
            : []),
          { href: "/admin/notifications", label: "Notifications", icon: <Bell className={icon} />, badge: true },
        ]
      : [
          { href: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard className={icon} /> },
          { href: "/student/clearance", label: "Clearance", icon: <ClipboardCheck className={icon} /> },
          { href: "/student/notifications", label: "Notifications", icon: <Bell className={icon} />, badge: true },
        ];

  const linkClass = (href: string) =>
    `inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
      pathname.startsWith(href)
        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block text-sm font-bold text-ink">UTG Digital</span>
            <span className="block text-xs font-medium text-muted">Student Services</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="btn btn-ghost btn-icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <span className="relative block h-5 w-5" aria-hidden="true">
              <span className={`absolute left-0 top-1/2 h-0.5 w-5 rounded bg-current transition-all duration-300 ease-in-out ${open ? "translate-y-0 rotate-45" : "-translate-y-[7px]"}`} />
              <span className={`absolute left-0 top-1/2 h-0.5 w-5 rounded bg-current transition-all duration-300 ease-in-out ${open ? "scale-x-0 opacity-0" : "opacity-100"}`} />
              <span className={`absolute left-0 top-1/2 h-0.5 w-5 rounded bg-current transition-all duration-300 ease-in-out ${open ? "translate-y-0 -rotate-45" : "translate-y-[7px]"}`} />
            </span>
          </button>
        </div>

        <nav className="hidden md:flex md:flex-row md:items-center md:gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.icon}
              {l.label}
              {l.badge && unread > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">{unread}</span>
              )}
            </Link>
          ))}
          <div className="ml-2 flex items-center">
            <ThemeToggle />
          </div>
          {user ? (
            <div className="ml-3 flex items-center gap-3 border-l border-line pl-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {user.full_name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="hidden text-sm lg:block">
                <span className="block font-medium leading-tight text-ink">{user.full_name}</span>
                <span className="block text-xs capitalize text-muted">{user.role.replace("_", " ")}</span>
              </span>
              <button
                className="btn btn-ghost btn-icon"
                aria-label="Log out"
                title="Log out"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost">
                Student login
              </Link>
              <Link href="/admin/login" className="btn btn-ghost">
                <ShieldCheck className="h-4 w-4" /> Staff
              </Link>
              {pathname !== "/register" && (
                <Link href="/register" className="btn btn-primary">
                  Register
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className={`absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-surface shadow-pop transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
            <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
              <BrandMark className="h-9 w-9" />
              <span className="leading-tight">
                <span className="block text-sm font-bold text-ink">UTG Digital</span>
                <span className="block text-xs font-medium text-muted">Student Services</span>
              </span>
            </Link>
            <button className="btn btn-ghost btn-icon" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {user && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-3 dark:bg-slate-800/50">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {user.full_name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="min-w-0 text-sm">
                  <span className="block truncate font-semibold text-ink">{user.full_name}</span>
                  <span className="block text-xs capitalize text-muted">{user.role.replace("_", " ")}</span>
                </span>
              </div>
            )}

            {user ? (
              <nav className="flex flex-col gap-1" aria-label="Primary">
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Menu</p>
                {links.map((l) => {
                  const active = pathname.startsWith(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand-500" />}
                      {l.icon}
                      <span className="flex-1">{l.label}</span>
                      {l.badge && unread > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">{unread}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">Get started</p>
                <Link href="/register" className="btn btn-primary min-h-12 w-full" onClick={() => setOpen(false)}>
                  Create Account
                </Link>
                <Link href="/login" className="btn btn-secondary min-h-12 w-full" onClick={() => setOpen(false)}>
                  Student Login
                </Link>
                <Link href="/admin/login" className="btn btn-secondary min-h-12 w-full" onClick={() => setOpen(false)}>
                  <ShieldCheck className="h-4 w-4" /> Staff Portal
                </Link>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <ThemeToggle labeled />
            {user && (
              <button
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                onClick={() => {
                  setOpen(false);
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
