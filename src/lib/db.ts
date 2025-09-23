import { PrismaClient } from "@prisma/client"

function assertEnv(keys: string[]) {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return;
  }
  const missing = keys.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error('[ENV_CHECK] Missing: ' + missing.join(', '));
  }
}

assertEnv(['DATABASE_URL', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
