"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";

export default function SidebarShell() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isPublicRoute =
    pathname === "/" || pathname === "/auth" || pathname === "/privacy" || pathname === "/terms";

  if (isPublicRoute && status === "loading") {
    return null;
  }

  const isPublicVisitor = !session?.user;

  if (isPublicVisitor && isPublicRoute) {
    return null;
  }

  return <Sidebar />;
}
