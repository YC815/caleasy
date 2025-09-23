"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ensureUserExists } from "@/lib/user-utils"
import type { NutritionRecord, NutritionRecordWithFood, NutritionInput } from "@/lib/types"

// 統一的營養記錄創建函數 - 消除所有特殊情況
export async function createNutritionRecord(
  userId: string,
  data: NutritionInput,
  recordedAt?: Date
): Promise<NutritionRecord> {
  console.log("[CREATE_NUTRITION_RECORD] 開始創建營養記錄:", {
    userId,
    data,
    recordedAt,
    hasDb: !!db,
    hasNutritionRecordModel: !!db?.nutritionRecord,
    timestamp: new Date().toISOString()
  })

  try {
    console.log("[CREATE_NUTRITION_RECORD] 確保用戶存在:", { userId })
    await ensureUserExists(userId)
    console.log("[CREATE_NUTRITION_RECORD] 用戶確認存在")

    const recordData = {
      userId,
      name: data.name,
      category: String(data.category),
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      sourceType: data.sourceType,
      foodId: data.foodId || null,
      amount: data.amount || null,
      recordedAt: recordedAt || new Date()
    }

    console.log("[CREATE_NUTRITION_RECORD] 準備創建記錄資料:", {
      recordData,
      timestamp: new Date().toISOString()
    })

    const record = await db.nutritionRecord.create({
      data: recordData
    })

    console.log("[CREATE_NUTRITION_RECORD] 營養記錄創建成功:", {
      recordId: record.id,
      recordName: record.name,
      calories: record.calories,
      sourceType: record.sourceType,
      userId: record.userId,
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
    return record
  } catch (error) {
    console.error("[CREATE_NUTRITION_RECORD] 營養記錄創建失敗:", {
      userId,
      data,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// 向後相容：基於食物的營養記錄創建（重導向到統一函數）
export async function createFoodBasedRecord(
  userId: string,
  data: { foodId: string; amount: number },
  recordedAt?: Date
): Promise<NutritionRecord> {
  console.log("[CREATE_FOOD_BASED] 重導向到統一創建函數:", {
    userId,
    data,
    recordedAt,
    timestamp: new Date().toISOString()
  })

  return await createNutritionRecordFromFood(userId, data.foodId, data.amount, recordedAt)
}

// 向後相容：直接營養記錄創建（重導向到統一函數）
export async function createDirectNutritionRecord(
  userId: string,
  data: { name?: string; category: string; calories: number; protein: number; carbs: number; fat: number },
  recordedAt?: Date
): Promise<NutritionRecord> {
  console.log("[CREATE_DIRECT_NUTRITION] 重導向到統一創建函數:", {
    userId,
    data,
    recordedAt,
    timestamp: new Date().toISOString()
  })

  const nutritionInput: NutritionInput = {
    name: data.name || "手動輸入",
    category: String(data.category),
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    sourceType: "manual"
  }

  return await createNutritionRecord(userId, nutritionInput, recordedAt)
}

export async function getNutritionRecordsByDate(
  userId: string,
  date: Date = new Date()
): Promise<NutritionRecordWithFood[]> {
  // 使用 UTC 時間確保跨時區一致性
  const utcDate = new Date(date.toISOString().split('T')[0] + 'T00:00:00.000Z')

  const startOfDay = new Date(utcDate)
  const endOfDay = new Date(utcDate)
  endOfDay.setUTCHours(23, 59, 59, 999)

  console.log("[GET_NUTRITION_BY_DATE] 開始查詢日期營養記錄:", {
    userId,
    date: date.toISOString(),
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString(),
    hasDb: !!db,
    hasNutritionRecordModel: !!db?.nutritionRecord,
    timestamp: new Date().toISOString()
  })

  try {
    const records = await db.nutritionRecord.findMany({
      where: {
        userId,
        recordedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        food: true
      },
      orderBy: { recordedAt: "asc" }
    })

    console.log("[GET_NUTRITION_BY_DATE] 日期營養記錄查詢成功:", {
      userId,
      date: date.toISOString(),
      recordsCount: records.length,
      recordIds: records.map(r => r.id),
      totalCalories: records.reduce((sum, r) => sum + (r.calories || 0), 0),
      timestamp: new Date().toISOString()
    })

    return records
  } catch (error) {
    console.error("[GET_NUTRITION_BY_DATE] 日期營養記錄查詢失敗:", {
      userId,
      date: date.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function getNutritionRecordsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<NutritionRecordWithFood[]> {
  // 確保使用 UTC 時間進行範圍查詢
  const utcStartDate = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z')
  const utcEndDate = new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
  console.log("[GET_NUTRITION_BY_RANGE] 開始查詢日期範圍營養記錄:", {
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    dateRangeDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    hasDb: !!db,
    hasNutritionRecordModel: !!db?.nutritionRecord,
    timestamp: new Date().toISOString()
  })

  try {
    const records = await db.nutritionRecord.findMany({
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

    console.log("[GET_NUTRITION_BY_RANGE] 日期範圍營養記錄查詢成功:", {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      recordsCount: records.length,
      totalCalories: records.reduce((sum, r) => sum + (r.calories || 0), 0),
      dateSpread: {
        earliest: records.length > 0 ? records[0].recordedAt?.toISOString() : null,
        latest: records.length > 0 ? records[records.length - 1].recordedAt?.toISOString() : null
      },
      timestamp: new Date().toISOString()
    })

    return records
  } catch (error) {
    console.error("[GET_NUTRITION_BY_RANGE] 日期範圍營養記錄查詢失敗:", {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}


export async function deleteNutritionRecord(recordId: string): Promise<void> {
  console.log("[DELETE_NUTRITION_RECORD] 開始刪除營養記錄:", {
    recordId,
    hasDb: !!db,
    hasNutritionRecordModel: !!db?.nutritionRecord,
    timestamp: new Date().toISOString()
  })

  try {
    await db.nutritionRecord.delete({
      where: { id: recordId }
    })

    console.log("[DELETE_NUTRITION_RECORD] 營養記錄刪除成功:", {
      recordId,
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
  } catch (error) {
    console.error("[DELETE_NUTRITION_RECORD] 營養記錄刪除失敗:", {
      recordId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
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
    timestamp: new Date().toISOString()
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
        protein: record.protein,
        carbs: record.carbs,
        fat: record.fat
      },
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
    return record
  } catch (error) {
    console.error("[UPDATE_NUTRITION_RECORD] 營養記錄更新失敗:", {
      recordId,
      updateData: data,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
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
    timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    })

    return records
  } catch (error) {
    console.error("[GET_RECENT_NUTRITION] 最近營養記錄查詢失敗:", {
      userId,
      limit,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
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
  console.log("[CREATE_RECORD_FROM_FOOD] 開始從食物創建營養記錄:", {
    userId,
    foodId,
    amount,
    recordedAt,
    timestamp: new Date().toISOString()
  })

  try {
    // 獲取食物資料
    const food = await db.food.findUnique({
      where: { id: foodId }
    })

    if (!food) {
      throw new Error("Food not found")
    }

    // 計算營養素
    const factor = amount / 100
    const nutritionInput: NutritionInput = {
      name: food.name,
      category: food.category,
      calories: food.caloriesPer100g * factor,
      protein: food.proteinPer100g * factor,
      carbs: food.carbsPer100g * factor,
      fat: food.fatPer100g * factor,
      sourceType: "food",
      foodId: food.id,
      amount: amount
    }

    console.log("[CREATE_RECORD_FROM_FOOD] 計算營養素:", {
      foodName: food.name,
      amount,
      factor,
      calculatedNutrition: {
        calories: nutritionInput.calories,
        protein: nutritionInput.protein,
        carbs: nutritionInput.carbs,
        fat: nutritionInput.fat
      },
      timestamp: new Date().toISOString()
    })

    return await createNutritionRecord(userId, nutritionInput, recordedAt)
  } catch (error) {
    console.error("[CREATE_RECORD_FROM_FOOD] 從食物創建營養記錄失敗:", {
      userId,
      foodId,
      amount,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}