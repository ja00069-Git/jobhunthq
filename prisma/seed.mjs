import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const sampleResumes = [
  {
    name: "General Resume",
    fileUrl: "https://example.com/resumes/general-resume.pdf",
  },
  {
    name: "Product Resume",
    fileUrl: "https://example.com/resumes/product-resume.pdf",
  },
];

const sampleApplications = [
  {
    company: "Stripe",
    role: "Backend Engineer",
    status: "applied",
    source: "Referral",
    dateApplied: new Date("2026-04-03"),
    notes: "Strong fit for distributed systems and API infrastructure.",
    resumeName: "General Resume",
  },
  {
    company: "Notion",
    role: "Full Stack Engineer",
    status: "interview",
    source: "Careers page",
    dateApplied: new Date("2026-03-28"),
    notes: "Recruiter screen completed; awaiting technical round.",
    resumeName: "General Resume",
  },
  {
    company: "Vercel",
    role: "Developer Experience Engineer",
    status: "interview",
    source: "LinkedIn",
    dateApplied: new Date("2026-03-25"),
    notes: "Strong alignment with frontend platform and developer tooling.",
    resumeName: "Product Resume",
  },
  {
    company: "OpenAI",
    role: "Software Engineer",
    status: "offer",
    source: "Outbound application",
    dateApplied: new Date("2026-03-10"),
    notes: "Offer received; comparing package and timing.",
    resumeName: "General Resume",
  },
  {
    company: "Figma",
    role: "Product Engineer",
    status: "rejected",
    source: "Employee referral",
    dateApplied: new Date("2026-02-22"),
    notes: "Good process and feedback; worth revisiting later in the year.",
    resumeName: "Product Resume",
  },
  {
    company: "Linear",
    role: "Frontend Engineer",
    status: "withdrawn",
    source: "Direct outreach",
    dateApplied: new Date("2026-02-14"),
    notes: "Withdrew after timeline changed and role focus shifted.",
    resumeName: "Product Resume",
  },
];

async function upsertResume(resume) {
  const existingResume = await prisma.resume.findFirst({
    where: {
      ownerId: null,
      name: resume.name,
    },
  });

  if (existingResume) {
    return prisma.resume.update({
      where: { id: existingResume.id },
      data: { fileUrl: resume.fileUrl },
    });
  }

  return prisma.resume.create({
    data: {
      ...resume,
      ownerId: null,
    },
  });
}

async function upsertCompany(name) {
  const existingCompany = await prisma.company.findFirst({
    where: {
      ownerId: null,
      name,
    },
  });

  if (existingCompany) {
    return existingCompany;
  }

  return prisma.company.create({
    data: {
      name,
      ownerId: null,
    },
  });
}

async function main() {
  const resumeMap = new Map();

  for (const resume of sampleResumes) {
    const record = await upsertResume(resume);
    resumeMap.set(resume.name, record.id);
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const application of sampleApplications) {
    const companyRecord = await upsertCompany(application.company);
    const existingApplication = await prisma.application.findFirst({
      where: {
        ownerId: null,
        company: application.company,
        role: application.role,
      },
    });

    const data = {
      company: application.company,
      role: application.role,
      status: application.status,
      source: application.source,
      dateApplied: application.dateApplied,
      notes: application.notes,
      ownerId: null,
      companyId: companyRecord.id,
      resumeId: resumeMap.get(application.resumeName) ?? null,
    };

    if (existingApplication) {
      await prisma.application.update({
        where: { id: existingApplication.id },
        data,
      });
      updatedCount += 1;
      continue;
    }

    await prisma.application.create({ data });
    createdCount += 1;
  }

  const [applications, companies, resumes, importedEmails] = await Promise.all([
    prisma.application.count({ where: { ownerId: null } }),
    prisma.company.count({ where: { ownerId: null } }),
    prisma.resume.count({ where: { ownerId: null } }),
    prisma.importedEmail.count({ where: { ownerId: null } }),
  ]);

  console.log(
    JSON.stringify(
      {
        message: "Seeded sample workspace data for final testing.",
        createdCount,
        updatedCount,
        applications,
        companies,
        resumes,
        importedEmails,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed sample data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
