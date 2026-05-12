import Link from "next/link";

export default function LegalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/70 bg-white/40 px-3 py-3 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/30 sm:px-4 lg:px-5">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Job Seekers Hub</p>

        <nav className="flex items-center gap-3" aria-label="Legal">
          <Link className="underline-offset-4 transition hover:text-slate-700 hover:underline dark:hover:text-slate-200" href="/privacy">
            Privacy Policy
          </Link>
          <span aria-hidden>•</span>
          <Link className="underline-offset-4 transition hover:text-slate-700 hover:underline dark:hover:text-slate-200" href="/terms">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
