import AuthButton from "@/components/auth-button";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/30 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/35">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Focused workspace
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Keep applications, job emails, and resumes aligned in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
