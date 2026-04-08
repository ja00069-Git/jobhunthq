"use client";

import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("./Sidebar"), {
  ssr: false,
  loading: () => (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 border-r border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/45 lg:flex lg:flex-col" />
  ),
});

export default function SidebarShell() {
  return <Sidebar />;
}
