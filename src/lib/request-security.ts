import { NextResponse } from "next/server";

export function validateTrustedOrigin(request: Request) {
  const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(request.method);
  const origin = request.headers.get("origin");

  if (!origin) {
    return process.env.NODE_ENV === "production" && !isSafeMethod
      ? NextResponse.json({ error: "Invalid origin." }, { status: 403 })
      : null;
  }

  const allowedOrigins = new Set<string>();

  if (process.env.NEXTAUTH_URL) {
    try {
      allowedOrigins.add(new URL(process.env.NEXTAUTH_URL).origin);
    } catch {
      // Ignore malformed config here and fall back to the current request host.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    allowedOrigins.add(`${protocol}://${host}`);
  }

  return allowedOrigins.has(origin)
    ? null
    : NextResponse.json({ error: "Invalid origin." }, { status: 403 });
}
