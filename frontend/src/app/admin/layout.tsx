"use client";

import { usePathname } from "next/navigation";
import Guard from "@/components/Guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;
  return <Guard area="admin">{children}</Guard>;
}
