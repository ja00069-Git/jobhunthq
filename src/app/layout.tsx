import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AuthProvider from "@/components/auth-provider";
import SidebarShell from "@/components/layout/SidebarShell";
import ThemeHydrator from "@/components/layout/ThemeHydrator";
import TopBar from "@/components/layout/TopBar";
import LegalFooter from "../components/layout/LegalFooter";
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
  title: "Job Seekers Hub — Job Search Tracker",
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
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="text-slate-900 dark:text-slate-100">
        <ThemeHydrator />

        <AuthProvider>
          <div className="flex min-h-screen">
            <SidebarShell />

            <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
              <TopBar />

              <main className="flex-1 overflow-x-clip overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
                {children}
              </main>

              <LegalFooter />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
