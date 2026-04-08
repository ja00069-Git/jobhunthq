"use client";

import { FiMoon, FiSun } from "react-icons/fi";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";

    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="ui-icon-btn rounded-2xl h-[42px] w-[42px]"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <FiMoon className="h-4 w-4 dark:hidden" />
      <FiSun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
