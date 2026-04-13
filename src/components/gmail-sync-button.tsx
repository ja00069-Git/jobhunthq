"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type MessageTone = "info" | "success" | "error";

export default function GmailSyncButton() {
  const router = useRouter();
  const { status } = useSession();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<MessageTone>("info");
  const hasAutoSynced = useRef(false);

  const syncGmail = useCallback(
    async (auto = false) => {
      if (status !== "authenticated" || isSyncing) {
        return;
      }

      setIsSyncing(true);
      setTone("info");

      if (!auto) {
        setMessage("");
      }

      try {
        const response = await fetch("/api/gmail", {
          cache: "no-store",
        });

        const data = (await response.json().catch(() => [])) as
          | Array<{ applicationId?: string }>
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            !Array.isArray(data) && data?.error
              ? data.error
              : "Could not check Gmail for job emails.",
          );
        }

        const importedCount = Array.isArray(data) ? data.length : 0;

        setTone(importedCount > 0 ? "success" : "info");
        setMessage(
          importedCount > 0
            ? `Found ${importedCount} new job email${importedCount === 1 ? "" : "s"}.`
            : auto
              ? "Checked Gmail. No new job emails found."
              : "No new job emails found.",
        );

        router.refresh();
      } catch (error) {
        setTone("error");
        setMessage(
          error instanceof Error ? error.message : "Could not check Gmail.",
        );
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing, router, status],
  );

  useEffect(() => {
    if (status === "authenticated" && !hasAutoSynced.current) {
      hasAutoSynced.current = true;
      void syncGmail(true);
    }
  }, [status, syncGmail]);

  if (!mounted || status === "loading") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
        Checking your email...
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        onClick={() => void signIn("google", { callbackUrl: "/review" })}
        className="ui-btn-primary min-w-[170px] justify-center"
      >
        Connect Gmail
      </button>
    );
  }

  const messageStyles = {
    info: "border-slate-200 bg-slate-50 text-slate-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-700",
  } as const;

  return (
    <div className="flex flex-col items-start gap-1.5 lg:items-end" aria-live="polite">
      <button
        type="button"
        onClick={() => void syncGmail()}
        disabled={isSyncing}
        className="ui-btn-primary min-w-[170px] justify-center"
      >
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            isSyncing ? "animate-pulse bg-amber-400" : "bg-emerald-400"
          }`}
        />
        {isSyncing ? "Checking..." : "Check for emails"}
      </button>

      {message ? (
        <p
          className={`max-w-sm rounded-xl border px-3 py-1.5 text-xs ${messageStyles[tone]}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
