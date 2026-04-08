"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FiChevronDown, FiLogOut } from "react-icons/fi";
import { signIn, signOut, useSession } from "next-auth/react";

function getInitials(name?: string | null, email?: string | null) {
  const base = name?.trim() || email?.split("@")[0] || "User";

  return base
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AuthButton() {
  const { data: session, status } = useSession();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  if (!mounted || status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
        Loading account...
      </div>
    );
  }

  if (session?.user) {
    const initials = getInitials(session.user.name, session.user.email);

    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-2.5 py-2 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {initials}
          </div>
          <FiChevronDown className={`h-4 w-4 text-slate-500 transition ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95" role="menu">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-blue-500">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {session.user.name ?? "Signed in"}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {session.user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="ui-btn-secondary mt-3 w-full"
              role="menuitem"
            >
              <FiLogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signIn("google")}
      className="ui-btn-secondary text-slate-900 hover:-translate-y-0.5 hover:shadow-md dark:text-slate-100"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
      >
        <path
          d="M21.805 12.23c0-.68-.061-1.334-.174-1.961H12v3.708h5.498a4.7 4.7 0 0 1-2.04 3.083v2.56h3.306c1.936-1.782 3.041-4.41 3.041-7.39Z"
          fill="#4285F4"
        />
        <path
          d="M12 22c2.76 0 5.074-.914 6.765-2.48l-3.306-2.56c-.914.613-2.084.975-3.459.975-2.658 0-4.91-1.794-5.716-4.207H2.865v2.64A10 10 0 0 0 12 22Z"
          fill="#34A853"
        />
        <path
          d="M6.284 13.728A5.99 5.99 0 0 1 5.964 12c0-.6.108-1.182.32-1.728v-2.64H2.865A10 10 0 0 0 2 12c0 1.61.386 3.133 1.067 4.456l3.217-2.728Z"
          fill="#FBBC05"
        />
        <path
          d="M12 6.065c1.5 0 2.846.516 3.906 1.53l2.93-2.93C17.07 3.02 14.757 2 12 2A10 10 0 0 0 2.865 7.632l3.419 2.64C7.09 7.86 9.342 6.065 12 6.065Z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  );
}
