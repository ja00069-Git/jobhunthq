"use client";

import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FiBriefcase,
  FiChevronsLeft,
  FiChevronsRight,
  FiFileText,
  FiHome,
  FiInbox,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links: Array<{ name: string; href: string; icon: IconType }> = [
  { name: "Dashboard", href: "/", icon: FiHome },
  { name: "Applications", href: "/applications", icon: FiBriefcase },
  { name: "Review", href: "/review", icon: FiInbox },
  { name: "Companies", href: "/companies", icon: HiOutlineBuildingOffice2 },
  { name: "Resumes", href: "/resumes", icon: FiFileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/70 bg-white/55 p-3 backdrop-blur-xl transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-950/45 lg:flex lg:flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white/80 p-2.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
        <div
          className={`flex gap-2 ${
            collapsed ? "justify-center" : "items-center justify-between"
          }`}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-sm ring-4 ring-blue-100/70 dark:bg-blue-500 dark:ring-blue-950/70">
                JH
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">JobHuntHQ</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Applications, emails, resumes</p>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="ui-icon-btn shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <FiChevronsRight className="h-4 w-4" />
            ) : (
              <FiChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <nav className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/75">
        {!collapsed ? (
          <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Menu
          </p>
        ) : null}

        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                collapsed ? "justify-center px-0" : "gap-3"
              } ${
                active
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{link.name}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
