import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  APPLICATION_STATUS_OPTIONS,
  normalizeApplicationStatus,
  type ApplicationStatus,
} from "@/lib/application-status";
import { getCurrentUserRecord } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateTrustedOrigin } from "@/lib/request-security";

const handlePrismaError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = unique constraint, P2025 = record not found, etc.
    console.error("[prisma] known error", error.code, error.message);
    return NextResponse.json(
      { error: "Database request failed.", code: error.code },
      { status: 409 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[prisma] initialization error", error.message);
    return NextResponse.json(
      { error: "Database unavailable. Please try again later." },
      { status: 503 },
    );
  }

  console.error("[prisma] unexpected error", error);
  return NextResponse.json(
    { error: "An unexpected error occurred." },
    { status: 500 },
  );
};

type CreateApplicationPayload = {
  company?: unknown;
  role?: unknown;
  status?: unknown;
  source?: unknown;
  dateApplied?: unknown;
  notes?: unknown;
  resumeId?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const parseOptionalString = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const parseDateApplied = (value: unknown) => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export async function GET() {
  const currentUser = await getCurrentUserRecord();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const applications = await prisma.application.findMany({
      where: { ownerId: currentUser.user.id },
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        source: true,
        dateApplied: true,
        notes: true,
        gmailId: true,
        companyId: true,
        resumeId: true,
        createdAt: true,
      },
      orderBy: [{ dateApplied: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(applications);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUserRecord();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const originError = validateTrustedOrigin(request);
  if (originError) return originError;

  const rateLimitError = enforceRateLimit({
    key: `applications:create:${currentUser.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  let payload: CreateApplicationPayload;

  try {
    payload = (await request.json()) as CreateApplicationPayload;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    !isNonEmptyString(payload.company) ||
    !isNonEmptyString(payload.role) ||
    !isNonEmptyString(payload.status)
  ) {
    return NextResponse.json(
      { error: "company, role, and status are required." },
      { status: 400 },
    );
  }

  const normalizedStatus = normalizeApplicationStatus(payload.status);

  if (!normalizedStatus) {
    return NextResponse.json(
      {
        error: `status must be one of: ${APPLICATION_STATUS_OPTIONS.map((option) => option.label).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const dateApplied = parseDateApplied(payload.dateApplied);

  if (!dateApplied) {
    return NextResponse.json(
      { error: "dateApplied must be a valid date string." },
      { status: 400 },
    );
  }

  try {
    const ownerId = currentUser.user.id;
    const companyName = payload.company.trim();
    const companyRecord = await prisma.company.upsert({
      where: {
        ownerId_name: {
          ownerId,
          name: companyName,
        },
      },
      update: {},
      create: {
        name: companyName,
        ownerId,
      },
    });

    const application = await prisma.application.create({
      data: {
        company: companyName,
        role: payload.role.trim(),
        status: normalizedStatus,
        source: parseOptionalString(payload.source),
        dateApplied,
        notes: parseOptionalString(payload.notes),
        ownerId,
        companyId: companyRecord.id,
        resumeId: parseOptionalString(payload.resumeId),
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUserRecord();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const originError = validateTrustedOrigin(request);
  if (originError) return originError;

  const rateLimitError = enforceRateLimit({
    key: `applications:update:${currentUser.user.id}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  let payload: { id?: unknown; status?: unknown; resumeId?: unknown };

  try {
    payload = (await request.json()) as {
      id?: unknown;
      status?: unknown;
      resumeId?: unknown;
    };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(payload.id)) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const updateData: {
    status?: ApplicationStatus;
    resumeId?: string | null;
  } = {};

  if (payload.status !== undefined) {
    if (!isNonEmptyString(payload.status)) {
      return NextResponse.json(
        { error: "status must be a non-empty string when provided." },
        { status: 400 },
      );
    }

    const normalizedStatus = normalizeApplicationStatus(payload.status);

    if (!normalizedStatus) {
      return NextResponse.json(
        {
          error: `status must be one of: ${APPLICATION_STATUS_OPTIONS.map((option) => option.label).join(", ")}.`,
        },
        { status: 400 },
      );
    }

    updateData.status = normalizedStatus;
  }

  if (payload.resumeId !== undefined) {
    updateData.resumeId = parseOptionalString(payload.resumeId);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one field to update." },
      { status: 400 },
    );
  }

  try {
    const targetId = payload.id.trim();
    const existing = await prisma.application.findFirst({
      where: {
        id: targetId,
        ownerId: currentUser.user.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: targetId },
      data: updateData,
      include: {
        resume: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUserRecord();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const originError = validateTrustedOrigin(request);
  if (originError) return originError;

  const rateLimitError = enforceRateLimit({
    key: `applications:delete:${currentUser.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  let payload: { id?: unknown };

  try {
    payload = (await request.json()) as { id?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(payload.id)) {
    return NextResponse.json(
      { error: "id is required." },
      { status: 400 },
    );
  }

  try {
    const deleted = await prisma.application.deleteMany({
      where: {
        id: payload.id.trim(),
        ownerId: currentUser.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePrismaError(error);
  }
}