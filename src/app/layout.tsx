import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import AuthProvider from "@/components/auth-provider";
import SidebarShell from "@/components/layout/SidebarShell";
import TopBar from "@/components/layout/TopBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobHuntHQ — Job Search Tracker",
  description:
    "Organize your applications, review job emails, track companies, and keep your resumes ready in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="text-slate-900 dark:text-slate-100">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
} catch {}`}
        </Script>

        <AuthProvider>
          <div className="flex min-h-screen">
            <SidebarShell />

            <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
              <TopBar />

              <main className="flex-1 overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
