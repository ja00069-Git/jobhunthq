export const dynamic = "force-dynamic";

import { FiBriefcase, FiGlobe } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

import MetricCard from "@/components/ui/metric-card";
import PageHeader from "@/components/ui/page-header";
import { getStatusLabel } from "@/lib/application-status";
import { prisma } from "@/lib/prisma";

export default async function CompaniesPage() {
  const [companies, totalApplications, activeCompanies] = await Promise.all([
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
        applications: {
          orderBy: [{ dateApplied: "desc" }, { createdAt: "desc" }],
          take: 4,
          select: {
            id: true,
            role: true,
            status: true,
            dateApplied: true,
            resume: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.application.count(),
    prisma.company.count({
      where: {
        applications: {
          some: {
            status: {
              in: ["applied", "interview"],
            },
          },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        eyebrow="Companies"
        title="Track company activity"
        description="See where you have applied and review your history with each company."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />} label="Companies" value={companies.length} tone="slate" />
        <MetricCard icon={<FiBriefcase className="h-5 w-5" />} label="Applications" value={totalApplications} tone="blue" />
        <MetricCard icon={<FiGlobe className="h-5 w-5" />} label="Companies in progress" value={activeCompanies} tone="amber" />
      </div>

      {companies.length === 0 ? (
        <div className="ui-surface-card border-dashed p-10 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No companies yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Companies appear automatically when you add an application or save a job email.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {companies.map((company) => (
            <article
              key={company.id}
              className="ui-surface-card ui-animate-enter ui-hover-lift p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{company.name}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {company._count.applications} job{company._count.applications === 1 ? "" : "s"} saved
                  </p>
                </div>

                <span className="ui-badge-neutral">
                  {company._count.applications} applications
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You have {company._count.applications} application{company._count.applications === 1 ? "" : "s"} saved for this company.
              </p>

              <div className="mt-4 space-y-2">
                {company.applications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                    No applications added yet.
                  </div>
                ) : (
                  company.applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{application.role}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {application.dateApplied.toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Resume used: {application.resume?.name ?? "Not assigned"}
                          </p>
                        </div>
                        <span className="ui-badge-soft">
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

