export const APPLICATION_STATUS_OPTIONS = [
  {
    value: "applied",
    label: "Applied",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "interview",
    label: "Interview",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "offer",
    label: "Offer",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "rejected",
    label: "Rejected",
    color: "bg-red-100 text-red-700",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
    color: "bg-zinc-200 text-zinc-700",
  },
  {
    value: "ghosted",
    label: "Ghosted",
    color: "bg-slate-100 text-slate-700",
  },
] as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS_OPTIONS)[number]["value"];

const statusAliasMap: Record<string, ApplicationStatus> = {
  wishlist: "applied",
  saved: "applied",
  interested: "applied",
  applied: "applied",
  phone: "interview",
  "phone screen": "interview",
  "phone-screen": "interview",
  interview: "interview",
  interviewing: "interview",
  offer: "offer",
  rejected: "rejected",
  withdrawn: "withdrawn",
};

export function normalizeApplicationStatus(
  value: unknown,
): ApplicationStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  return statusAliasMap[value.trim().toLowerCase()] ?? null;
}

export function getStatusColor(status: string) {
  const normalizedStatus = normalizeApplicationStatus(status);

  return (
    APPLICATION_STATUS_OPTIONS.find(
      (option) => option.value === normalizedStatus,
    )?.color ?? "bg-gray-100 text-gray-700"
  );
}

export function getStatusLabel(status: string) {
  const normalizedStatus = normalizeApplicationStatus(status);

  return (
    APPLICATION_STATUS_OPTIONS.find(
      (option) => option.value === normalizedStatus,
    )?.label ?? status
  );
}
