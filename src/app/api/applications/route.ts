import { Prisma } from "@/generated/prisma";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

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
  location?: unknown;
  salary?: unknown;
  dateApplied?: unknown;
  notes?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const parseOptionalString = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return typeof value === "string" ? value : null;
};

const parseOptionalSalary = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseInt(value, 10);

    if (Number.isInteger(parsedValue)) {
      return parsedValue;
    }
  }

  return Number.NaN;
};

const parseDateApplied = (value: unknown) => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      orderBy: [{ dateApplied: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(applications);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: Request) {
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

  const dateApplied = parseDateApplied(payload.dateApplied);

  if (!dateApplied) {
    return NextResponse.json(
      { error: "dateApplied must be a valid date string." },
      { status: 400 },
    );
  }

  const salary = parseOptionalSalary(payload.salary);

  if (Number.isNaN(salary)) {
    return NextResponse.json(
      { error: "salary must be an integer when provided." },
      { status: 400 },
    );
  }

  try {
    const application = await prisma.application.create({
      data: {
        company: payload.company.trim(),
        role: payload.role.trim(),
        status: payload.status.trim(),
        location: parseOptionalString(payload.location),
        salary,
        dateApplied,
        notes: parseOptionalString(payload.notes),
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}