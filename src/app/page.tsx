import Link from "next/link";
import { FiArrowRight, FiBriefcase, FiInbox, FiPercent, FiTarget, FiTrendingUp, FiXCircle } from "react-icons/fi";

import MetricCard from "@/components/ui/metric-card";
import PageHeader from "@/components/ui/page-header";
import { getStatusLabel } from "@/lib/application-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [applications, pendingImports, companies, resumes] = await Promise.all([
    prisma.application.findMany({
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.importedEmail.count({
      where: { reviewed: false },
    }),
    prisma.company.count(),
    prisma.resume.count(),
  ]);

  const total = applications.length;
  const active = applications.filter(
    (application) =>
      !["offer", "rejected", "withdrawn"].includes(application.status),
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
          <>
            <Link
              href="/applications"
              className="ui-btn-primary"
            >
              Applications
            </Link>
            <Link
              href="/review"
              className="ui-btn-secondary"
            >
              Emails to review ({pendingImports})
            </Link>
          </>
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
        <section className="ui-surface-card p-3.5 sm:p-4">
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