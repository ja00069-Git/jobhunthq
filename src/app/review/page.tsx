import Link from "next/link";

import GmailSyncButton from "@/components/gmail-sync-button";
import ReviewQueue from "../../components/ReviewQueue";
import PageHeader from "@/components/ui/page-header";
import { getPendingImportsCount } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const pendingImports = await getPendingImportsCount();

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        eyebrow="Review"
        title="Review job-related emails"
        description="Look over new emails, keep the useful ones, and save them as applications."
        badges={[{ label: `${pendingImports} emails to review`, tone: "amber" }]}
        actions={
          <>
            <GmailSyncButton />
            <Link
              href="/applications"
              className="ui-btn-link"
            >
              Back to applications
            </Link>
          </>
        }
      />

      <ReviewQueue pendingCount={pendingImports} />
    </div>
  );
}
