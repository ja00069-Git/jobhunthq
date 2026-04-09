import { NextResponse } from "next/server";

import { normalizeApplicationStatus } from "@/lib/application-status";
import { prisma } from "@/lib/prisma";

function detectImportSource(from: string) {
  const lower = from.toLowerCase();

  if (lower.includes("indeed")) return "Indeed";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("workday")) return "Workday";

  return "Email";
}

export async function GET() {
  try {
    const data = await prisma.importedEmail.findMany({
      where: { reviewed: false },
      orderBy: { createdAt: "desc" },
    });

    const normalizedData = data.map((email) => ({
      ...email,
      status: normalizeApplicationStatus(email.status) ?? null,
    }));

    return NextResponse.json(normalizedData);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load imports.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      company?: string;
      role?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const email = await prisma.importedEmail.findUnique({
      where: { id: body.id },
    });

    if (!email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextStatus = normalizeApplicationStatus(email.status) ?? "applied";

    const updated = await prisma.importedEmail.update({
      where: { id: body.id },
      data: {
        company: body.company?.trim() || email.company,
        role: body.role?.trim() || email.role,
        status: nextStatus,
      },
    });

    const existingApplication = updated.gmailId
      ? await prisma.application.findUnique({
          where: { gmailId: updated.gmailId },
        })
      : null;

    if (!existingApplication) {
      const companyName = updated.company?.trim() || "Unknown";
      const companyRecord =
        companyName !== "Unknown"
          ? await prisma.company.upsert({
              where: { name: companyName },
              update: {},
              create: { name: companyName },
            })
          : null;

      await prisma.application.create({
        data: {
          company: companyName,
          role: updated.role || "Unknown Role",
          status: nextStatus,
          source: updated.source || detectImportSource(updated.from),
          dateApplied: new Date(),
          gmailId: updated.gmailId,
          companyId: companyRecord?.id,
          notes: `Imported from Gmail: ${email.subject} (score: ${email.score})`,
        },
      });
    }

    await prisma.importedEmail.update({
      where: { id: body.id },
      data: { reviewed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to approve import.",
      },
      { status: 500 },
    );
  }
}
