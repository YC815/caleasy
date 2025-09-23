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

// 詳細的資料庫初始化日誌
console.log("[DB_INIT] 資料庫客戶端初始化:", {
  hasClient: !!db,
  hasNutritionRecord: !!db?.nutritionRecord,
  hasFood: !!db?.food,
  hasUser: !!db?.user,
  hasGlobalFood: !!db?.globalFood,
  hasWeeklyStats: !!db?.weeklyStats,
  clientKeys: Object.keys(db || {}),
  env: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL ? '已設定' : '未設定',
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '已設定' : '未設定',
  clerkSecretKey: process.env.CLERK_SECRET_KEY ? '已設定' : '未設定',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  utcOffset: new Date().getTimezoneOffset(),
  timestamp: new Date().toISOString()
})

// 檢查必要的環境變數
function validateEnvironment() {
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    console.error("[ENV_CHECK] 缺少必要環境變數:", {
      missing,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
    return false
  }

  console.log("[ENV_CHECK] 環境變數檢查通過")
  return true
}

// 測試資料庫連接
async function testDatabaseConnection() {
  try {
    console.log("[DB_TEST] 測試資料庫連接...")

    // 先檢查環境變數
    if (!validateEnvironment()) {
      throw new Error("Environment validation failed")
    }

    await db.$queryRaw`SELECT 1`
    console.log("[DB_TEST] 資料庫連接成功")
  } catch (error) {
    console.error("[DB_TEST] 資料庫連接失敗:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      timestamp: new Date().toISOString()
    })
  }
}

// 在所有環境中進行連接測試
testDatabaseConnection()