"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ensureUserExists } from "@/lib/user-utils"
import { timeManager } from "@/lib/time"
import type { NutritionRecord, NutritionRecordWithFood, NutritionInput } from "@/lib/types"

// 統一的營養記錄創建函數 - 消除所有特殊情況
export async function createNutritionRecord(
  userId: string,
  data: NutritionInput,
  recordedAt?: Date
): Promise<NutritionRecord> {
  try {
    await ensureUserExists(userId)

    const record = await db.nutritionRecord.create({
      data: {
        userId,
        name: data.name,
        category: String(data.category),
        calories: data.calories,
        protein: data.protein,
        sourceType: data.sourceType,
        foodId: data.foodId || null,
        amount: data.amount || null,
        recordedAt: recordedAt || timeManager.now()
      }
    })

    // 自動更新相關週統計
    try {
      const { updateWeeklyStats } = await import("./weekly-stats-actions")
      await updateWeeklyStats(userId, record.recordedAt)
    } catch (statsError) {
      console.error("週統計更新失敗，但記錄已創建:", statsError)
    }

    revalidatePath("/")
    return record
  } catch (error) {
    console.error("營養記錄創建失敗:", error)
    throw error
  }
}

// 向後相容：基於食物的營養記錄創建（重導向到統一函數）
export async function createFoodBasedRecord(
  userId: string,
  data: { foodId: string; amount: number },
  recordedAt?: Date
): Promise<NutritionRecord> {
  return await createNutritionRecordFromFood(userId, data.foodId, data.amount, recordedAt)
}

// 向後相容：直接營養記錄創建（重導向到統一函數）
export async function createDirectNutritionRecord(
  userId: string,
  data: { name?: string; category: string; calories: number; protein: number },
  recordedAt?: Date
): Promise<NutritionRecord> {
  const nutritionInput: NutritionInput = {
    name: data.name || "手動輸入",
    category: String(data.category),
    calories: data.calories,
    protein: data.protein,
    sourceType: "manual"
  }

  return await createNutritionRecord(userId, nutritionInput, recordedAt)
}

export async function getNutritionRecordsByDate(
  userId: string,
  date: Date = timeManager.now()
): Promise<NutritionRecordWithFood[]> {
  const { start: utcStartDate, end: utcEndDate } = timeManager.getDayBounds(date)

  // 調試時間邊界計算 - 幫助定位「8點更新」問題
  if (process.env.NODE_ENV === 'development') {
    timeManager.debugDayBounds(date)
  }

  try {
    return await db.nutritionRecord.findMany({
      where: {
        userId,
        recordedAt: {
          gte: utcStartDate,
          lte: utcEndDate
        }
      },
      include: {
        food: true
      },
      orderBy: { recordedAt: "asc" }
    })
  } catch (error) {
    console.error("日期營養記錄查詢失敗:", error)
    throw error
  }
}

export async function getNutritionRecordsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<NutritionRecordWithFood[]> {
  const { start: actualStartDate } = timeManager.getDayBounds(startDate)
  const { end: actualEndDate } = timeManager.getDayBounds(endDate)


  try {
    const records = await db.nutritionRecord.findMany({
      where: {
        userId,
        recordedAt: {
          gte: actualStartDate,
          lte: actualEndDate
        }
      },
      include: {
        food: true
      },
      orderBy: { recordedAt: "asc" }
    })


    return records
  } catch (error) {
    console.error("日期範圍營養記錄查詢失敗:", error)
    throw error
  }
}


export async function deleteNutritionRecord(recordId: string): Promise<void> {
  console.log("[DELETE_NUTRITION_RECORD] 開始刪除營養記錄:", {
    recordId,
    hasDb: !!db,
    hasNutritionRecordModel: !!db?.nutritionRecord,
    timestamp: timeManager.now().toISOString()
  })

  try {
    // 先獲取記錄信息，用於更新週統計
    const record = await db.nutritionRecord.findUnique({
      where: { id: recordId }
    })

    if (!record) {
      throw new Error("營養記錄不存在")
    }

    await db.nutritionRecord.delete({
      where: { id: recordId }
    })

    console.log("[DELETE_NUTRITION_RECORD] 營養記錄刪除成功:", {
      recordId,
      timestamp: timeManager.now().toISOString()
    })

    // 自動更新相關週統計
    try {
      const { updateWeeklyStats } = await import("./weekly-stats-actions")
      await updateWeeklyStats(record.userId, record.recordedAt)
    } catch (statsError) {
      console.error("週統計更新失敗，但記錄已刪除:", statsError)
    }

    revalidatePath("/")
  } catch (error) {
    console.error("[DELETE_NUTRITION_RECORD] 營養記錄刪除失敗:", {
      recordId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: timeManager.now().toISOString()
    })
    throw error
  }
}

export async function updateNutritionRecord(
  recordId: string,
  data: Partial<Omit<NutritionRecord, "id" | "userId">>
): Promise<NutritionRecord> {
  console.log("[UPDATE_NUTRITION_RECORD] 開始更新營養記錄:", {
    recordId,
    updateData: data,
    hasDb: !!db,
    hasNutritionRecordModel: !!db?.nutritionRecord,
    timestamp: timeManager.now().toISOString()
  })

  try {
    const record = await db.nutritionRecord.update({
      where: { id: recordId },
      data
    })

    console.log("[UPDATE_NUTRITION_RECORD] 營養記錄更新成功:", {
      recordId: record.id,
      recordName: record.name,
      updatedFields: Object.keys(data),
      newNutrition: {
        calories: record.calories,
        protein: record.protein
      },
      timestamp: timeManager.now().toISOString()
    })

    // 自動更新相關週統計
    try {
      const { updateWeeklyStats } = await import("./weekly-stats-actions")
      await updateWeeklyStats(record.userId, record.recordedAt)
    } catch (statsError) {
      console.error("週統計更新失敗，但記錄已更新:", statsError)
    }

    revalidatePath("/")
    return record
  } catch (error) {
    console.error("[UPDATE_NUTRITION_RECORD] 營養記錄更新失敗:", {
      recordId,
      updateData: data,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: timeManager.now().toISOString()
    })
    throw error
  }
}

export async function getRecentNutritionRecords(
  userId: string,
  limit: number = 50
): Promise<NutritionRecordWithFood[]> {
  console.log("[GET_RECENT_NUTRITION] 開始查詢最近營養記錄:", {
    userId,
    limit,
    hasDb: !!db,
    hasNutritionRecordModel: !!db?.nutritionRecord,
    timestamp: timeManager.now().toISOString()
  })

  try {
    const records = await db.nutritionRecord.findMany({
      where: {
        userId
      },
      include: {
        food: true
      },
      orderBy: { recordedAt: "desc" },
      take: limit
    })

    console.log("[GET_RECENT_NUTRITION] 最近營養記錄查詢成功:", {
      userId,
      limit,
      recordsCount: records.length,
      totalCalories: records.reduce((sum, r) => sum + (r.calories || 0), 0),
      dateRange: {
        latest: records.length > 0 ? records[0].recordedAt?.toISOString() : null,
        earliest: records.length > 0 ? records[records.length - 1].recordedAt?.toISOString() : null
      },
      timestamp: timeManager.now().toISOString()
    })

    return records
  } catch (error) {
    console.error("[GET_RECENT_NUTRITION] 最近營養記錄查詢失敗:", {
      userId,
      limit,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: timeManager.now().toISOString()
    })
    throw error
  }
}

// 從食物創建營養記錄的輔助函數
export async function createNutritionRecordFromFood(
  userId: string,
  foodId: string,
  amount: number,
  recordedAt?: Date
): Promise<NutritionRecord> {
  try {
    const food = await db.food.findUnique({
      where: { id: foodId }
    })

    if (!food) {
      throw new Error("Food not found")
    }

    const factor = amount / 100
    const nutritionInput: NutritionInput = {
      name: food.name,
      category: food.category,
      calories: food.caloriesPer100g * factor,
      protein: food.proteinPer100g * factor,
      sourceType: "food",
      foodId: food.id,
      amount: amount
    }

    return await createNutritionRecord(userId, nutritionInput, recordedAt)
  } catch (error) {
    console.error("從食物創建營養記錄失敗:", error)
    throw error
  }
}