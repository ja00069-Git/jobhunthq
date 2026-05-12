import { NextResponse } from "next/server";

import type { Status } from "@prisma/client";
import {
  errorResponse,
  handleRouteError,
  unauthorizedResponse,
} from "@/lib/api-error";
import { getCurrentUserRecord } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateTrustedOrigin } from "@/lib/request-security";

type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailMessagePart = {
  mimeType?: string;
  body?: {
    data?: string;
  };
  parts?: GmailMessagePart[];
  headers?: GmailHeader[];
};

type GmailMessage = {
  id?: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailMessagePart;
};

type GmailListResponse = {
  messages?: Array<{ id: string }>;
};

/**
 * HELPERS
 */
function extractHeader(headers: GmailHeader[], name: string) {
  return headers.find((h) => h.name === name)?.value || "";
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) =>
      word.replace(/[A-Za-z][A-Za-z'’-]*/g, (token) =>
        token === token.toUpperCase() && token.length > 1
          ? token
          : capitalize(token.toLowerCase()),
      ),
    )
    .join(" ");
}

const genericCompanyNames = new Set([
  "email",
  "gmail",
  "google",
  "google jobs",
  "indeed",
  "linkedin",
  "workday",
]);

const roleKeywordPattern =
  /(Engineer|Developer|Intern|Manager|Associate|Analyst|Architect|Specialist|Consultant|Administrator|Designer|Scientist|Coordinator|Technician)/i;

function sanitizeCompanyName(value: string | null | undefined) {
  const cleaned = value?.trim().replace(/\s+/g, " ").replace(/[.,;:]+$/g, "");

  if (!cleaned) {
    return "Unknown";
  }

  return genericCompanyNames.has(cleaned.toLowerCase()) ? "Unknown" : cleaned;
}

function decodeBase64Url(value: string | undefined) {
  if (!value) {
    return "";
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parsePossibleDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value.trim());
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function extractPayloadText(part?: GmailMessagePart): string {
  if (!part) {
    return "";
  }

  const ownBody = decodeBase64Url(part.body?.data);
  const ownText = part.mimeType === "text/html" ? stripHtml(ownBody) : ownBody;
  const childText = (part.parts ?? []).map(extractPayloadText).filter(Boolean).join(" ");

  return [ownText, childText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function buildEmailText(snippet: string, payload?: GmailMessagePart) {
  return [snippet, extractPayloadText(payload)]
    .filter(Boolean)
    .join(" ")
    .replace(/[\u200B-\u200D\uFEFF\u2060]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanRoleTitle(value: string | null | undefined) {
  const cleaned = value?.trim().replace(/\s+/g, " ").replace(/[|•·]+$/g, "");

  if (!cleaned) {
    return "Unknown Role";
  }

  return cleaned
    .replace(/\s*[-–—]\s*[A-Z][A-Za-z ]+(?:,\s*[A-Z]{2})?$/, "")
    .replace(/\s+at\s+[A-Z][A-Za-z0-9&.,'’\- ]+$/, "")
    .replace(/\s*[-–—]\s*$/, "")
    .trim();
}

/**
 * PROVIDER DETECTION
 */
function detectSource(from: string) {
  const lower = from.toLowerCase();

  if (lower.includes("indeed")) return "indeed";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("workday")) return "workday";

  return "unknown";
}

/**
 * FILTER — REMOVE JOB ALERTS
 */
function isJobAlert(subject: string, snippet: string) {
  const text = `${subject} ${snippet}`.toLowerCase();

  return (
    text.includes("is hiring") ||
    text.includes("job alert") ||
    text.includes("new jobs") ||
    text.includes("recommended jobs") ||
    text.includes("more jobs") ||
    /\b\d+\s+(new|more)\s+jobs\b/.test(text)
  );
}

/**
 * DETECT REAL APPLICATIONS (GENERIC)
 */
function isRealApplicationEmail(subject: string, snippet: string) {
  const text = `${subject} ${snippet}`.toLowerCase();

  return (
    subject.toLowerCase().startsWith("indeed application:") ||
    text.includes("application submitted") ||
    text.includes("your application was sent") ||
    text.includes("thank you for applying") ||
    text.includes("application received")
  );
}

/**
 * PROVIDER PARSERS
 */
function parseIndeedEmail(subject: string, snippet: string) {
  const roleMatch = subject.match(/^Indeed Application:\s*(.+)/i);

  const role = roleMatch
    ? toTitleCase(roleMatch[1])
    : "Unknown Role";

  const escapedRole = role !== "Unknown Role" ? escapeRegExp(role) : null;

  const companyMatch =
    snippet.match(/the following items were sent to\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:\.|,|$)/i) ??
    (escapedRole
      ? snippet.match(
          new RegExp(
            `${escapedRole}\\s+(?:company logo\\s+)?([A-Z][A-Za-z0-9&.,'’\\- ]+?)\\s+-\\s+[A-Z]`,
            "i",
          ),
        )
      : null) ??
    snippet.match(
      /application submitted\s+.+?\s+(?:company logo\s+)?([A-Z][A-Za-z0-9&.,'’\- ]+?)\s+-\s+[A-Z]/i,
    ) ??
    snippet.match(/sent to\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:\.|,|$)/i) ??
    snippet.match(/for\s+.+?\s+at\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:[.,]|$)/i) ??
    snippet.match(/with\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:[.,]|$)/i);

  return {
    role,
    company: sanitizeCompanyName(companyMatch?.[1]),
  };
}

function parseLinkedInEmail(subject: string, snippet: string) {
  const normalizedSubject = subject.replace(/\s+/g, " ").trim();
  const text = `${subject}\n${snippet}`.replace(/\s+/g, " ").trim();

  const companyMatch =
    normalizedSubject.match(/your application was sent to\s+([A-Z][A-Za-z0-9&.,'’\- ]+)$/i) ??
    text.match(/your application was sent to\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:\.|,|$)/i) ??
    text.match(/sent to\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:\.|,|$)/i);

  const company = sanitizeCompanyName(companyMatch?.[1]);
  const roleSearchText =
    company !== "Unknown"
      ? text
          .split(new RegExp(`your application was sent to\\s+${escapeRegExp(company)}`, "i"))
          .slice(1)
          .join(" ")
          .trim()
      : text;

  const roleMatch = roleSearchText.match(
    /\b([A-Z][A-Za-z0-9/&+,'’\- ]{2,80}?(?:Engineer|Developer|Intern|Manager|Associate|Analyst|Architect|Specialist|Consultant|Administrator|Designer|Scientist|Coordinator|Technician))\b/i,
  );

  return {
    company,
    role: cleanRoleTitle(roleMatch?.[1]),
  };
}

function parseWorkdayEmail(subject: string) {
  const match = subject.match(/applying for\s+(.+)\s+at\s+([A-Z][A-Za-z0-9& ]+)/i);

  return {
    role: match ? cleanRoleTitle(toTitleCase(match[1])) : "Unknown Role",
    company: sanitizeCompanyName(match ? match[2].trim() : undefined),
  };
}

/**
 * GENERIC FALLBACK PARSING
 */
function extractRole(subject: string, snippet: string) {
  const text = `${subject}\n${snippet}`.replace(/\s+/g, " ").trim();

  const subjectRole =
    subject.match(/^Indeed Application:\s*(.+)$/i)?.[1] ??
    subject.match(/applying for\s+(.+)\s+at\s+[A-Z]/i)?.[1];

  if (subjectRole) {
    return cleanRoleTitle(toTitleCase(subjectRole));
  }

  const roleMatch = text.match(
    /\b([A-Z][A-Za-z0-9/&+,'’\- ]{2,80}?(?:Engineer|Developer|Intern|Manager|Associate|Analyst|Architect|Specialist|Consultant|Administrator|Designer|Scientist|Coordinator|Technician))\b/i,
  );

  if (roleMatch?.[1] && roleKeywordPattern.test(roleMatch[1])) {
    return cleanRoleTitle(roleMatch[1]);
  }

  return "Unknown Role";
}

function extractCompany(from: string, subject: string, snippet: string) {
  const combinedText = `${subject}\n${snippet}`;

  const subjectMatch =
    combinedText.match(/\bat\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:[.,]|$)/) ??
    combinedText.match(/sent to\s+([A-Z][A-Za-z0-9&.,'’\- ]+?)(?:[.,]|$)/i);

  if (subjectMatch?.[1]) {
    return sanitizeCompanyName(subjectMatch[1]);
  }

  const match = from.match(/@([a-zA-Z0-9-]+)\.(?:com|io|ai|co|net|org)/i);

  if (match) {
    return sanitizeCompanyName(toTitleCase(match[1].replace(/[-_]+/g, " ")));
  }

  return "Unknown";
}

function calculateAccuracyScore({
  source,
  subject,
  snippet,
  company,
  role,
}: {
  source: string;
  subject: string;
  snippet: string;
  company: string;
  role: string;
}) {
  const text = `${subject} ${snippet}`.toLowerCase();

  let score = 30;

  if (source !== "unknown") score += 20;

  if (
    text.includes("application submitted") ||
    text.includes("your application was sent") ||
    text.includes("thank you for applying") ||
    text.includes("application received")
  ) {
    score += 20;
  }

  if (subject.toLowerCase().startsWith("indeed application:")) {
    score += 10;
  }

  if (company !== "Unknown") score += 10;
  if (role !== "Unknown Role") score += 10;

  return Math.min(score, 100);
}

function extractAppliedAt(text: string, internalDate?: string) {
  const explicitDateMatch = text.match(
    /\bapplied on\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/i,
  );

  const explicitDate = parsePossibleDate(explicitDateMatch?.[1]);

  if (explicitDate) {
    return explicitDate;
  }

  if (!internalDate) {
    return null;
  }

  const internalTimestamp = Number.parseInt(internalDate, 10);
  return Number.isNaN(internalTimestamp) ? null : new Date(internalTimestamp);
}

/**
 * STATUS
 */
function detectStatus(text: string): Status {
  if (
    text.includes("rejected") ||
    text.includes("not moving forward") ||
    text.includes("will not be moving") ||
    text.includes("decided to move forward with other") ||
    text.includes("decided not to move forward") ||
    text.includes("not selected")
  ) {
    return "rejected";
  }

  if (
    text.includes("invited to interview") ||
    text.includes("schedule an interview") ||
    text.includes("schedule a call") ||
    text.includes("schedule time with") ||
    text.includes("interview invitation") ||
    text.includes("interview request") ||
    text.includes("we'd like to interview") ||
    text.includes("we would like to interview") ||
    text.includes("like to schedule") ||
    text.includes("phone screen") ||
    text.includes("technical screen") ||
    text.includes("please select a time") ||
    text.includes("book a time") ||
    text.includes("pick a time")
  ) {
    return "interview";
  }

  if (
    text.includes("offer received") ||
    text.includes("offer letter") ||
    text.includes("offer of employment") ||
    text.includes("pleased to offer") ||
    text.includes("we are pleased to offer") ||
    text.includes("delighted to offer") ||
    text.includes("extend an offer") ||
    text.includes("formal offer")
  ) {
    return "offer";
  }

  return "applied";
}

/**
 * MAIN
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUserRecord();

    if (!currentUser?.session.accessToken) {
      return unauthorizedResponse("Unauthorized.");
    }

    const originError = validateTrustedOrigin(request);
    if (originError) return originError;

    const ownerId = currentUser.user.id;

    const rateLimitError = enforceRateLimit({
      key: `gmail:sync:${ownerId}`,
      limit: 10,
      windowMs: 5 * 60_000,
    });
    if (rateLimitError) return rateLimitError;

    const query = encodeURIComponent(
      '(application OR "thank you for applying" OR "application submitted" OR "your application was sent")'
    );

    const listRes = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${query}`,
      {
        headers: {
          Authorization: `Bearer ${currentUser.session.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!listRes.ok) {
      return errorResponse({
        status: 502,
        code: "gmail_upstream_error",
        message: "Gmail sync failed.",
      });
    }

    const listData = (await listRes.json()) as GmailListResponse;

    const messages = await Promise.all(
      (listData.messages ?? []).map(async (m) => {
        const res = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}`,
          {
            headers: {
              Authorization: `Bearer ${currentUser.session.accessToken}`,
            },
            cache: "no-store",
          }
        );
        return res.json();
      })
    );

    const parsed = await Promise.all(
      messages.map(async (message: GmailMessage) => {
        if (!message.id) return null;

        const headers = message.payload?.headers ?? [];
        const subject = extractHeader(headers, "Subject");
        const from = extractHeader(headers, "From");
        const snippet = message.snippet ?? "";
        const emailText = buildEmailText(snippet, message.payload);

        // 🔥 FILTERS
        if (isJobAlert(subject, emailText)) return null;
        if (!isRealApplicationEmail(subject, emailText)) return null;

        const source = detectSource(from);

        let company = "Unknown";
        let role = "Unknown Role";

        // provider parsing
        if (source === "indeed") {
          const p = parseIndeedEmail(subject, emailText);
          company = p.company;
          role = p.role;
        } else if (source === "linkedin") {
          const p = parseLinkedInEmail(subject, emailText);
          company = p.company;
          role = p.role;
        } else if (source === "workday") {
          const p = parseWorkdayEmail(subject);
          company = p.company;
          role = p.role;
        }

        // fallback
        if (company === "Unknown") {
          company = extractCompany(from, subject, emailText);
        }

        if (role === "Unknown Role") {
          role = extractRole(subject, emailText);
        }

        const existingApp = await prisma.application.findFirst({
          where: {
            ownerId,
            gmailId: message.id,
          },
        });

        if (existingApp) return null;

        const status = detectStatus(`${subject} ${from} ${emailText}`.toLowerCase());
        const appliedAt = extractAppliedAt(`${subject} ${emailText}`, message.internalDate);
        const score = calculateAccuracyScore({
          source,
          subject,
          snippet: emailText,
          company,
          role,
        });
        const sourceLabel = source === "unknown" ? "Email" : capitalize(source);

        const imported = await prisma.importedEmail.upsert({
          where: {
            ownerId_gmailId: {
              ownerId,
              gmailId: message.id,
            },
          },
          update: {
            subject,
            from,
            snippet: emailText || snippet,
            company,
            role,
            source: sourceLabel,
            status,
            appliedAt,
            score,
          },
          create: {
            gmailId: message.id,
            subject,
            from,
            snippet: emailText || snippet,
            company,
            role,
            source: sourceLabel,
            status,
            appliedAt,
            score,
            ownerId,
          },
        });

        return imported;
      })
    );

    return NextResponse.json(parsed.filter(Boolean));
  } catch (error) {
    return handleRouteError(error, {
      label: "gmail.sync",
      fallbackMessage: "Gmail sync failed.",
      fallbackCode: "gmail_sync_failed",
    });
  }
}