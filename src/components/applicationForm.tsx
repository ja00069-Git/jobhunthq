"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FiFileText, FiPlus, FiSave, FiX } from "react-icons/fi";

import {
  APPLICATION_STATUS_OPTIONS,
  type ApplicationStatus,
} from "@/lib/application-status";

const getTodayDate = () => new Date().toISOString().split("T")[0] ?? "";
const fieldClassName = "ui-input";

type ResumeOption = {
  id: string;
  name: string;
};

export default function ApplicationForm({
  resumes = [],
}: {
  resumes?: ResumeOption[];
}) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [source, setSource] = useState("");
  const [dateApplied, setDateApplied] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setDateApplied(getTodayDate());
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          role,
          status,
          source,
          dateApplied,
          resumeId,
          notes,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Could not save the application.");
      }

      setSuccessMessage("Application added successfully.");
      setCompany("");
      setRole("");
      setStatus("applied");
      setSource("");
      setDateApplied(getTodayDate());
      setResumeId("");
      setNotes("");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-40 rounded-xl bg-slate-200" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="ui-btn-primary min-w-[160px]"
        >
          <FiPlus className="h-4 w-4" />
          Add application
        </button>

        {successMessage ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Saved
          </p>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
          <div className="h-full w-full max-w-[560px] overflow-y-auto border-l border-slate-200 bg-white/95 shadow-2xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
            <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                    New application
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
                    Application details
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Add the main details and choose the resume you used.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="ui-icon-btn text-slate-500"
                  aria-label="Close form"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 px-5 py-4 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Company</span>
                    <input
                      className={fieldClassName}
                      placeholder="Stripe"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Role</span>
                    <input
                      className={fieldClassName}
                      placeholder="Backend Engineer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</span>
                    <select
                      className={fieldClassName}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                    >
                      {APPLICATION_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date applied</span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={dateApplied}
                      onChange={(e) => setDateApplied(e.target.value)}
                      required
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Source</span>
                    <input
                      className={fieldClassName}
                      placeholder="LinkedIn, referral, Indeed..."
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <FiFileText className="h-4 w-4" />
                      Resume used
                    </span>
                    <select
                      className={fieldClassName}
                      value={resumeId}
                      onChange={(e) => setResumeId(e.target.value)}
                    >
                      <option value="">Not selected</option>
                      {resumes.map((resume) => (
                        <option key={resume.id} value={resume.id}>
                          {resume.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes</span>
                    <textarea
                      className={`${fieldClassName} min-h-24 resize-y`}
                      rows={4}
                      placeholder="Contact notes, follow-ups, or anything important..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                </div>

                {errorMessage ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                    {errorMessage}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="ui-btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ui-btn-primary"
                >
                  <FiSave className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}