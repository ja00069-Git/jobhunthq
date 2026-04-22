"use client";

import { useState } from "react";
import { FiExternalLink, FiFileText, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type ResumeItem = {
  id: string;
  name: string;
  fileUrl: string;
  createdAt: string;
  applicationCount: number;
};

const resumeDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatResumeDate(value: string) {
  return resumeDateFormatter.format(new Date(value));
}

export default function ResumeManager({
  initialResumes,
}: {
  initialResumes: ResumeItem[];
}) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [name, setName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      let resolvedName = name.trim();
      let resolvedFileUrl = fileUrl.trim();

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/resumes/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = (await uploadResponse.json().catch(() => null)) as
          | { fileUrl?: string; fileName?: string; error?: string }
          | null;

        if (!uploadResponse.ok || !uploadData?.fileUrl) {
          throw new Error(uploadData?.error || "Failed to upload file.");
        }

        resolvedFileUrl = uploadData.fileUrl;

        if (!resolvedName) {
          resolvedName = (uploadData.fileName || file.name)
            .replace(/\.[^.]+$/, "")
            .trim();
        }
      }

      if (!resolvedName || !resolvedFileUrl) {
        throw new Error("Provide a name and upload a file or paste a file URL.");
      }

      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: resolvedName,
          fileUrl: resolvedFileUrl,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | ResumeItem
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data && "error" in data ? data.error || "Failed to save resume." : "Failed to save resume.",
        );
      }

      const createdResume = {
        ...(data as ResumeItem),
        applicationCount: 0,
      };
      setResumes((current) => [createdResume, ...current]);
      setName("");
      setFileUrl("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setMessage("Resume saved.");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      setMessage("");
      setError("");

      const response = await fetch("/api/resumes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete resume.");
      }

      setResumes((current) => current.filter((resume) => resume.id !== id));
      setMessage("Resume removed.");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <form
        onSubmit={handleSubmit}
        className="ui-surface-card ui-animate-enter p-5 xl:sticky xl:top-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
          Resumes
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Add a resume
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Save a name and a file link so you can reuse the right resume later.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
            <input
              className="ui-input"
              placeholder="Marketing resume"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Link to file</span>
            <input
              type="url"
              className="ui-input"
              placeholder="https://drive.google.com/..."
              value={fileUrl}
              onChange={(event) => setFileUrl(event.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Or upload file (.pdf, .doc, .docx)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="ui-input"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                if (selected && !name.trim()) {
                  setName(selected.name.replace(/\.[^.]+$/, ""));
                }
              }}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="ui-btn-primary mt-5"
        >
          {isSubmitting ? "Saving..." : "Save resume"}
        </button>
      </form>

      <section className="ui-surface-card ui-animate-enter p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Saved resumes
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Your resumes
            </h2>
          </div>
          <span className="ui-badge-neutral">
            {resumes.length} total
          </span>
        </div>

        {resumes.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
            No resumes saved yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {resumes.map((resume) => (
              <article
                key={resume.id}
                className="ui-surface-soft ui-animate-enter ui-hover-lift p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <FiFileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span>{resume.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Added {formatResumeDate(resume.createdAt)}
                      </span>
                      <span className="ui-badge-soft">
                        {resume.applicationCount} linked application{resume.applicationCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(resume.id)}
                    disabled={deletingId === resume.id}
                    className="ui-btn-secondary self-start"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    {deletingId === resume.id ? "Removing..." : "Remove"}
                  </button>
                </div>

                <a
                  href={resume.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                >
                  <FiExternalLink className="h-4 w-4" />
                  Open file
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}