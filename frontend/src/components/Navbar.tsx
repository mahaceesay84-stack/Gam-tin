"use client";

import { Bell, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, ClipboardCheck, X } from "lucide-react";
import Image from "next/image";
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
        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="crest">
            <Image src="/utg-crest.jpg" alt="UTG crest" width={56} height={40} priority className="h-10 w-auto" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-ink">UTG Digital</span>
            <span className="block text-xs font-medium text-muted">Student Services</span>
          </span>
        </Link>

        <button className="btn btn-ghost btn-icon md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-stretch gap-1 border-b border-line bg-surface p-4 shadow-pop md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          onClick={() => setOpen(false)}
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.icon}
              {l.label}
              {l.badge && unread > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">{unread}</span>
              )}
            </Link>
          ))}
          <div className="mt-2 flex items-center md:ml-2 md:mt-0">
            <ThemeToggle />
          </div>
          {user ? (
            <div className="mt-2 flex items-center gap-3 border-t border-line pt-3 md:ml-3 md:mt-0 md:border-0 md:border-l md:pl-4 md:pt-0">
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
            <div className="mt-2 flex items-center gap-2 md:ml-2 md:mt-0">
              <Link href="/login" className="btn btn-ghost">
                Student login
              </Link>
              <Link href="/admin/login" className="btn btn-ghost">
                <ShieldCheck className="h-4 w-4" /> Staff
              </Link>
              <Link href="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
