import { NextResponse } from "next/server";

import { normalizeApplicationStatus } from "@/lib/application-status";
import { getCurrentUserRecord } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateTrustedOrigin } from "@/lib/request-security";

function detectImportSource(from: string) {
  const lower = from.toLowerCase();

  if (lower.includes("indeed")) return "Indeed";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("workday")) return "Workday";

  return "Email";
}

export async function GET() {
  const currentUser = await getCurrentUserRecord();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const data = await prisma.importedEmail.findMany({
      where: {
        reviewed: false,
        ownerId: currentUser.user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    const normalizedData = data.map((email) => ({
      ...email,
      status: normalizeApplicationStatus(email.status) ?? null,
    }));

    return NextResponse.json(normalizedData);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to load imports.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUserRecord();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const originError = validateTrustedOrigin(req);
  if (originError) return originError;

  const rateLimitError = enforceRateLimit({
    key: `imports:approve:${currentUser.user.id}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  try {
    const body = (await req.json()) as {
      id?: string;
      company?: string;
      role?: string;
      status?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const email = await prisma.importedEmail.findFirst({
      where: {
        id: body.id,
        ownerId: currentUser.user.id,
      },
    });

    if (!email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextStatus =
      normalizeApplicationStatus(body.status) ??
      normalizeApplicationStatus(email.status) ??
      "applied";

    const updated = await prisma.importedEmail.update({
      where: { id: body.id },
      data: {
        company: body.company?.trim() || email.company,
        role: body.role?.trim() || email.role,
        status: nextStatus,
      },
    });

    const existingApplication = updated.gmailId
      ? await prisma.application.findFirst({
          where: {
            ownerId: currentUser.user.id,
            gmailId: updated.gmailId,
          },
        })
      : null;

    if (!existingApplication) {
      const companyName = updated.company?.trim() || "Unknown";
      const companyRecord =
        companyName !== "Unknown"
          ? await prisma.company.upsert({
              where: {
                ownerId_name: {
                  ownerId: currentUser.user.id,
                  name: companyName,
                },
              },
              update: {},
              create: {
                name: companyName,
                ownerId: currentUser.user.id,
              },
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
          ownerId: currentUser.user.id,
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
  } catch {
    return NextResponse.json(
      {
        error: "Failed to approve import.",
      },
      { status: 500 },
    );
  }
}
