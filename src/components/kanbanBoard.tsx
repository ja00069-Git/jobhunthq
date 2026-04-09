"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  APPLICATION_STATUS_OPTIONS,
  getStatusLabel,
  normalizeApplicationStatus,
  type ApplicationStatus,
} from "@/lib/application-status";

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  source?: string | null;
  resumeId?: string | null;
  resume?: {
    id: string;
    name: string;
  } | null;
};

type ResumeOption = {
  id: string;
  name: string;
};

const KANBAN_COLUMNS = APPLICATION_STATUS_OPTIONS;

const statuses: string[] = KANBAN_COLUMNS.map((option) => option.value);

function normalizeBoardApplications(applications: Application[]) {
  return applications.map((application) => ({
    ...application,
    status: normalizeApplicationStatus(application.status) ?? "applied",
  }));
}

export default function KanbanBoard({
  applications,
  resumes,
}: {
  applications: Application[];
  resumes: ResumeOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(() => normalizeBoardApplications(applications));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setItems(normalizeBoardApplications(applications));
  }, [applications]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const activeItem = items.find((item) => item.id === activeId);
    const overStatus =
      (over.data.current?.status as ApplicationStatus | undefined) ??
      ((statuses.includes(String(over.id) as ApplicationStatus)
        ? String(over.id)
        : activeItem?.status) as ApplicationStatus | undefined);

    if (!activeItem || !overStatus || activeItem.status === overStatus) {
      return;
    }

    const previousItems = items;

    // Move the card immediately for a snappy feel, then roll back if the
    // server update fails.
    setItems((prev) =>
      prev.map((item) =>
        item.id === activeId ? { ...item, status: overStatus } : item,
      ),
    );

    try {
      const response = await fetch("/api/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeId,
          status: overStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status.");
      }

      router.refresh();
    } catch {
      setItems(previousItems);
    }
  }

  async function handleResumeChange(id: string, resumeId: string) {
    const previousItems = items;
    const selectedResume = resumes.find((resume) => resume.id === resumeId) ?? null;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              resumeId: resumeId || null,
              resume: selectedResume,
            }
          : item,
      ),
    );

    try {
      const response = await fetch("/api/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          resumeId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update resume.");
      }

      router.refresh();
    } catch {
      setItems(previousItems);
    }
  }

  if (!isMounted) {
    return <KanbanSkeleton />;
  }

  const board = (
    <div className="space-y-2">
      <p className="px-1 text-xs text-slate-500 dark:text-slate-400 lg:hidden">
        Swipe sideways to view each stage of your application pipeline.
      </p>
      <div className="w-full overflow-x-auto pb-2">
        <div className="grid min-w-[960px] grid-cols-6 gap-3">
          {KANBAN_COLUMNS.map((option) => (
            <Column
              key={option.value}
              status={option.value}
              items={items}
              color={option.color}
              draggable={isMounted}
              resumes={resumes}
              onResumeChange={handleResumeChange}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <DndContext
      id="jobhunthq-kanban"
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {board}
    </DndContext>
  );
}

function KanbanSkeleton() {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="grid min-w-[960px] grid-cols-6 gap-3">
        {KANBAN_COLUMNS.map((option) => (
          <section
            key={option.value}
            className="flex min-h-[300px] flex-col rounded-[22px] border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className={`rounded-full px-3 py-1 text-sm font-semibold ${option.color}`}>
                {option.label}
              </div>
              <span className="ui-badge-soft text-slate-400">
                —
              </span>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-16 rounded bg-slate-100" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Column({
  status,
  items,
  color,
  draggable,
  resumes,
  onResumeChange,
}: {
  status: string;
  items: Application[];
  color: string;
  draggable: boolean;
  resumes: ResumeOption[];
  onResumeChange: (id: string, resumeId: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const filtered = items.filter((item) => item.status === status);

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[300px] snap-start flex-col rounded-[22px] border p-2.5 transition ${
        isOver
          ? "border-blue-300 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-950/30"
          : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={`rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
          {getStatusLabel(status)}
        </h2>

        <span className="ui-badge-soft">
          {filtered.length}
        </span>
      </div>

      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((app) => (
            <DraggableCard
              key={app.id}
              app={app}
              draggable={draggable}
              resumes={resumes}
              onResumeChange={onResumeChange}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-500">
            Move an application here.
          </div>
        )}
      </div>
    </section>
  );
}

function DraggableCard({
  app,
  draggable,
  resumes,
  onResumeChange,
}: {
  app: Application;
  draggable: boolean;
  resumes: ResumeOption[];
  onResumeChange: (id: string, resumeId: string) => Promise<void>;
}) {
  if (!draggable) {
    return (
      <StaticCard app={app} resumes={resumes} onResumeChange={onResumeChange} />
    );
  }

  return (
    <InteractiveCard
      app={app}
      resumes={resumes}
      onResumeChange={onResumeChange}
    />
  );
}

function StaticCard({
  app,
  resumes,
  onResumeChange,
}: {
  app: Application;
  resumes: ResumeOption[];
  onResumeChange: (id: string, resumeId: string) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80">
      <CardContent app={app} resumes={resumes} onResumeChange={onResumeChange} />
    </div>
  );
}

function InteractiveCard({
  app,
  resumes,
  onResumeChange,
}: {
  app: Application;
  resumes: ResumeOption[];
  onResumeChange: (id: string, resumeId: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: app.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 ${
        isDragging ? "cursor-grabbing opacity-80 shadow-lg" : "cursor-grab"
      }`}
    >
      <CardContent app={app} resumes={resumes} onResumeChange={onResumeChange} />
    </div>
  );
}

function CardContent({
  app,
  resumes,
  onResumeChange,
}: {
  app: Application;
  resumes: ResumeOption[];
  onResumeChange: (id: string, resumeId: string) => Promise<void>;
}) {
  return (
    <>
      <div className="min-w-0 space-y-1">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {app.role}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{app.company}</p>
        {app.source ? (
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {app.source}
          </p>
        ) : null}
      </div>

      <div className="mt-2.5" onPointerDownCapture={(event) => event.stopPropagation()}>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Resume used
          </span>
          <select
            value={app.resumeId ?? ""}
            onChange={(event) => void onResumeChange(app.id, event.target.value)}
            className="ui-input px-2.5 py-2 text-xs"
          >
            <option value="">No resume selected</option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
