"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function Guard({
  area,
  children,
}: {
  area: "student" | "admin";
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = user && (area === "student" ? user.role === "student" : user.role !== "student");

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace(area === "student" ? "/login" : "/admin/login");
    }
  }, [loading, allowed, area, router]);

  if (loading || !allowed) {
    return <p className="p-8 text-center text-gray-500">Loading…</p>;
  }
  return <>{children}</>;
}
