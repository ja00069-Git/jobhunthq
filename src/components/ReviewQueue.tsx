"use client";

import { useCallback, useEffect, useState } from "react";
import { FiBriefcase, FiCheckCircle, FiInbox, FiMail, FiXCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";

import { getStatusLabel, normalizeApplicationStatus } from "@/lib/application-status";

type ImportedEmail = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  company: string | null;
  role: string | null;
  source?: string | null;
  status: string | null;
  score: number;
};

type ApprovalUpdates = {
  company: string;
  role: string;
};

type ReviewQueueProps = {
  pendingCount: number;
};

type ReviewCardProps = {
  email: ImportedEmail;
  onApprove: (id: string, updates: ApprovalUpdates) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
};

export default function ReviewQueue({ pendingCount }: ReviewQueueProps) {
  const [emails, setEmails] = useState<ImportedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/imported", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Could not load emails to review.");
      }

      const data = (await res.json()) as unknown;
      setEmails(Array.isArray(data) ? (data as ImportedEmail[]) : []);
    } catch {
      setError("Could not load emails to review.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue, pendingCount]);

  async function approve(id: string, updates: ApprovalUpdates) {
    try {
      setApprovingId(id);
      setError("");

      const res = await fetch("/api/imported", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      const data = (await res.json().catch(() => ({ error: "Approval failed." }))) as {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve email.");
      }

      setEmails((prev) => prev.filter((email) => email.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setApprovingId(null);
    }
  }

  async function reject(id: string) {
    try {
      setRejectingId(id);
      setError("");

      const res = await fetch(`/api/imported/${id}`, {
        method: "DELETE",
      });

      const data = (await res.json().catch(() => ({ error: "Reject failed." }))) as {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject email.");
      }

      setEmails((prev) => prev.filter((email) => email.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed.");
    } finally {
      setRejectingId(null);
    }
  }

  const visibleCount = loading ? pendingCount : emails.length;

  return (
    <div className="space-y-5">
      <div className="ui-animate-enter">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Emails to review
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
          {visibleCount} email{visibleCount === 1 ? "" : "s"} to review
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Keep the useful job emails and remove the rest.
        </p>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadQueue()}
            className="ui-btn-secondary text-rose-700 hover:bg-rose-50"
          >
            Retry load
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 2xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-6 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="h-11 rounded-xl bg-slate-100" />
                <div className="h-11 rounded-xl bg-slate-100" />
              </div>
              <div className="mt-5 h-10 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <FiInbox className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            You are all caught up
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            New job emails will appear here after Gmail is checked.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {emails.map((email) => (
            <Card
              key={email.id}
              email={email}
              onApprove={approve}
              onReject={reject}
              isApproving={approvingId === email.id}
              isRejecting={rejectingId === email.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  email,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ReviewCardProps) {
  const [company, setCompany] = useState(email.company ?? "");
  const [role, setRole] = useState(email.role ?? "");
  const confidence = getConfidenceMeta(email.score);
  const canApprove = company.trim().length > 0 && role.trim().length > 0;

  return (
    <article className="ui-surface-card ui-animate-enter ui-hover-lift overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">
              {formatStatus(email.status)}
            </p>
            <h3 className="mt-2 break-words text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
              {role || email.role || email.subject}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
              {company || email.company || "Company not confirmed yet"}
            </p>
          </div>

          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${confidence.className}`}
          >
            {confidence.label} · {email.score}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="ui-badge-neutral">
            <FiBriefcase className="h-3.5 w-3.5" />
            {email.source || "Email"}
          </span>
          <span className="ui-badge-neutral min-w-0 max-w-full break-all">
            <FiMail className="h-3.5 w-3.5" />
            {email.from}
          </span>
        </div>

        <div className="ui-surface-soft p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Message preview
          </p>
          <p className="mt-2 break-words text-sm font-medium text-slate-700 dark:text-slate-200">
            {email.subject}
          </p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {email.snippet}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Company
            </span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="ui-input"
              placeholder="Company name"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Role
            </span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="ui-input"
              placeholder="Role title"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {canApprove
              ? "Save this email to your applications list."
              : "Add a company and job title before saving."}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onReject(email.id)}
              disabled={isApproving || isRejecting}
              className="ui-btn-secondary border-slate-300"
            >
              <FiXCircle className="h-4 w-4" />
              {isRejecting ? "Rejecting..." : "Reject"}
            </button>

            <button
              type="button"
              onClick={() =>
                void onApprove(email.id, {
                  company: company.trim(),
                  role: role.trim(),
                })
              }
              disabled={!canApprove || isApproving || isRejecting}
              className="ui-btn-primary disabled:bg-slate-300"
            >
              <FiCheckCircle className="h-4 w-4" />
              {isApproving ? "Saving..." : "Save to applications"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function getConfidenceMeta(score: number) {
  if (score >= 60) {
    return {
      label: "High confidence",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    };
  }

  if (score >= 30) {
    return {
      label: "Medium confidence",
      className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    };
  }

  return {
    label: "Low confidence",
    className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  };
}

function formatStatus(status: string | null | undefined) {
  if (!status) {
    return "Needs review";
  }

  const normalizedStatus = normalizeApplicationStatus(status);

  if (normalizedStatus) {
    return getStatusLabel(normalizedStatus);
  }

  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
