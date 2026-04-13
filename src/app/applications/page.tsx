export const dynamic = "force-dynamic";

import Link from "next/link";

import ApplicationForm from "@/components/applicationForm";
import KanbanBoard from "@/components/kanbanBoard";
import PageHeader from "@/components/ui/page-header";
import { getCurrentUserRecord } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export default async function ApplicationsPage() {
  const currentUser = await getCurrentUserRecord();
  const ownerId = currentUser?.user.id;

  const [applications, pendingImports, resumes] = ownerId
    ? await Promise.all([
        prisma.application.findMany({
          where: { ownerId },
          select: {
            id: true,
            company: true,
            role: true,
            status: true,
            source: true,
            resumeId: true,
            resume: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ dateApplied: "desc" }, { createdAt: "desc" }],
        }),
        prisma.importedEmail.count({
          where: {
            reviewed: false,
            ownerId,
          },
        }),
        prisma.resume.findMany({
          where: { ownerId },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        }),
      ])
    : [[], 0, []];

  const activePipeline = applications.filter(
    (application) => !["offer", "rejected", "withdrawn"].includes(application.status),
  ).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        eyebrow="Applications"
        title="Track every application"
        description="See your progress, update each stage, and note which resume you sent."
        badges={[
          { label: `${applications.length} applications` },
          { label: `${activePipeline} in progress`, tone: "blue" },
          { label: `${pendingImports} emails to review`, tone: "amber" },
        ]}
        actions={
          <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
            <Link
              href="/review"
              className="inline-flex min-h-10 min-w-[160px] items-center justify-center whitespace-nowrap px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Review emails
            </Link>
            <ApplicationForm resumes={resumes} groupedTrigger />
          </div>
        }
      />

      <KanbanBoard applications={applications} resumes={resumes} />
    </div>
  );
}
