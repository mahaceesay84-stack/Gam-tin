"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AppNotification, Paginated } from "@/lib/types";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

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
  }, [user]);

  const isStaff = user && user.role !== "student";
  const links = !user
    ? []
    : isStaff
      ? [
          { href: "/admin/dashboard", label: "Clearances" },
          ...(user.role === "super_admin" ? [{ href: "/admin/settings", label: "Settings" }] : []),
          { href: "/admin/notifications", label: "Notifications" },
        ]
      : [
          { href: "/student/dashboard", label: "Dashboard" },
          { href: "/student/clearance", label: "Clearance" },
          { href: "/student/notifications", label: "Notifications" },
        ];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand">
          UTG Digital Student Services
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="relative text-gray-700 hover:text-brand">
              {l.label}
              {l.label === "Notifications" && unread > 0 && (
                <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">
                  {unread}
                </span>
              )}
            </Link>
          ))}
          {user ? (
            <>
              <span className="hidden text-gray-500 sm:inline">{user.full_name}</span>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-brand">
                Student login
              </Link>
              <Link href="/admin/login" className="text-gray-700 hover:text-brand">
                Admin login
              </Link>
              <Link href="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
