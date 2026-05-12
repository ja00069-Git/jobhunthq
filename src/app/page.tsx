import Link from "next/link";
import { FiArrowRight, FiBriefcase, FiInbox, FiPercent, FiTarget, FiTrendingUp, FiXCircle } from "react-icons/fi";

import MetricCard from "@/components/ui/metric-card";
import PageHeader from "@/components/ui/page-header";
import { getStatusLabel } from "@/lib/application-status";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  if (!snapshot.isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="ui-surface-card ui-animate-enter w-full max-w-[380px] overflow-hidden">
          {/* Header band */}
          <div className="border-b border-slate-100 px-7 py-6 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              Job Seekers Hub
            </span>
            <h1 className="mt-3 text-[1.35rem] font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-100">
              Your job search,<br />under control.
            </h1>
            <p className="mt-2 text-[13px] leading-[1.55] text-slate-500 dark:text-slate-400">
              Track applications, review job emails, and keep every resume ready — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <div className="divide-y divide-slate-100 px-7 dark:divide-slate-800">
            {([
              { icon: "▦", label: "Application pipeline", sub: "Kanban board across every stage" },
              { icon: "✉", label: "Gmail review queue",   sub: "Import and triage job emails" },
              { icon: "◧", label: "Resume tracking",      sub: "Attach the right resume each time" },
            ] as const).map(({ icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3 py-3.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">{icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="border-t border-slate-100 px-7 py-5 dark:border-slate-800">
            <Link href="/auth" className="ui-btn-primary h-11 w-full justify-center text-[13px]">
              Get started — it&apos;s free
            </Link>
            <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
              No account required to explore.{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300">Privacy policy</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { applications, pendingImports, companies, resumes } = snapshot;

  const total = applications.length;
  const active = applications.filter(
    (application) =>
      !["offer", "rejected", "withdrawn", "ghosted"].includes(application.status),
  ).length;
  const interviews = applications.filter(
    (application) => application.status === "interview",
  ).length;
  const offers = applications.filter(
    (application) => application.status === "offer",
  ).length;
  const rejected = applications.filter(
    (application) => application.status === "rejected",
  ).length;
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;

  const recentApplications = applications.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-3.5">
      <PageHeader
        eyebrow="Dashboard"
        title="Manage your job search in one place"
        description="Review recent applications, check new job emails, and keep everything organized."
        badges={[
          { label: `${companies} companies saved` },
          { label: `${resumes} resumes saved`, tone: "blue" },
        ]}
        actions={
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
            <Link
              href="/applications"
              className="inline-flex min-h-10 min-w-[140px] items-center justify-center whitespace-nowrap border-r border-slate-200 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 dark:border-slate-700 dark:hover:bg-blue-400"
            >
              Applications
            </Link>
            <Link
              href="/review"
              className="inline-flex min-h-10 min-w-[180px] items-center justify-center whitespace-nowrap px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Emails to review ({pendingImports})
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Applications" value={total} tone="slate" icon={<FiBriefcase className="h-4 w-4" />} />
        <MetricCard label="In progress" value={active} tone="blue" icon={<FiTarget className="h-4 w-4" />} />
        <MetricCard label="Interviews" value={interviews} tone="amber" icon={<FiTrendingUp className="h-4 w-4" />} />
        <MetricCard label="Offers" value={offers} tone="emerald" icon={<FiInbox className="h-4 w-4" />} />
        <MetricCard label="Not selected" value={rejected} tone="rose" icon={<FiXCircle className="h-4 w-4" />} />
        <MetricCard label="Interview rate" value={interviewRate} suffix="%" tone="violet" icon={<FiPercent className="h-4 w-4" />} />
      </div>

      <div>
        <section className="ui-surface-card ui-animate-enter ui-hover-lift p-3.5 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Recent applications
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                A quick look at your latest applications.
              </p>
            </div>

            <Link
              href="/applications"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-300"
            >
              See all applications
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
              No applications yet. Add one yourself or review job emails to get started.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {application.role}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {application.company}
                      </p>
                    </div>
                    <span className="ui-badge-soft">
                      {getStatusLabel(application.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {application.source || "Added manually"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}