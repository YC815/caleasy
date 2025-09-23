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
  timestamp: new Date().toISOString()
})

// 測試資料庫連接
async function testDatabaseConnection() {
  try {
    console.log("[DB_TEST] 測試資料庫連接...")
    await db.$queryRaw`SELECT 1`
    console.log("[DB_TEST] 資料庫連接成功")
  } catch (error) {
    console.error("[DB_TEST] 資料庫連接失敗:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
  }
}

// 在部署環境中也進行連接測試
if (process.env.NODE_ENV === 'production') {
  testDatabaseConnection()
}