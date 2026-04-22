import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUserRecord } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isBlobUrl(value: string) {
  return value.includes(".blob.vercel-storage.com/");
}

function isPrivateBlobUrl(value: string) {
  return value.includes(".private.blob.vercel-storage.com/");
}

export async function GET(_request: Request, context: RouteContext) {
  const currentUser = await getCurrentUserRecord();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const { prisma } = await import("@/lib/prisma");

  const resume = await prisma.resume.findFirst({
    where: {
      id: id.trim(),
      ownerId: currentUser.user.id,
    },
    select: {
      fileUrl: true,
      name: true,
    },
  });

  if (!resume) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!isBlobUrl(resume.fileUrl)) {
    return NextResponse.redirect(resume.fileUrl);
  }

  try {
    const result = await get(resume.fileUrl, {
      access: isPrivateBlobUrl(resume.fileUrl) ? "private" : "public",
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Disposition": result.blob.contentDisposition || "attachment",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load file." }, { status: 500 });
  }
}
