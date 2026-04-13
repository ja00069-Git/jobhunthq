"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBriefcase, FiFileText, FiHome, FiInbox } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

import AuthButton from "@/components/auth-button";
import ThemeToggle from "@/components/layout/ThemeToggle";

const mobileLinks = [
  { label: "Home", href: "/", icon: FiHome },
  { label: "Applications", href: "/applications", icon: FiBriefcase },
  { label: "Review", href: "/review", icon: FiInbox },
  { label: "Companies", href: "/companies", icon: HiOutlineBuildingOffice2 },
  { label: "Resumes", href: "/resumes", icon: FiFileText },
];

export default function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/30 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/35">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-3 sm:px-4 lg:px-5">
        <div className="ui-animate-enter flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Focused workspace
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              Keep applications, job emails, and resumes aligned in one place.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Mobile navigation">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`ui-nav-item inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${
                  active
                    ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                    : "border border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
