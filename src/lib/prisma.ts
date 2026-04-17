import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

// Keep a single Prisma client during development hot reloads so we avoid
// opening extra database connections between refreshes.
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
};

// Next.js dev mode can temporarily hold onto an older generated client after
// schema changes, so we verify the models we rely on before reusing it.
const hasExpectedModels = (
  client: PrismaClient | undefined,
): client is PrismaClient => {
  if (!client) {
    return false;
  }

  const prismaWithModels = client as PrismaClient & {
    importedEmail?: unknown;
    company?: unknown;
    resume?: unknown;
  };

  return (
    typeof client.application !== "undefined" &&
    typeof prismaWithModels.importedEmail !== "undefined" &&
    typeof prismaWithModels.company !== "undefined" &&
    typeof prismaWithModels.resume !== "undefined"
  );
};

const prismaClient = hasExpectedModels(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createPrismaClient();

export const prisma: PrismaClient = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}