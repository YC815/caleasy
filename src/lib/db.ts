import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

// Debug logging
console.log("Database client initialized:", {
  hasClient: !!db,
  hasNutritionRecord: !!db?.nutritionRecord,
  clientKeys: Object.keys(db || {}),
  env: process.env.NODE_ENV
})