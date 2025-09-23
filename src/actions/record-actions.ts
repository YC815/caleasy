"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ensureUserExists } from "@/lib/user-utils"
import type { NutritionRecord, NutritionRecordWithFood, DirectNutritionInput, FoodBasedInput } from "@/lib/types"

// 創建直接輸入的營養記錄（其他分類）
export async function createDirectNutritionRecord(
  userId: string,
  data: DirectNutritionInput,
  recordedAt?: Date
): Promise<NutritionRecord> {
  await ensureUserExists(userId)

  const record = await db.nutritionRecord.create({
    data: {
      userId,
      name: data.name,
      category: data.category,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      foodId: null,
      amount: null,
      recordedAt: recordedAt || new Date()
    }
  })

  revalidatePath("/")
  return record
}

// 創建基於食物的營養記錄（傳統模式）
export async function createFoodBasedRecord(
  userId: string,
  data: FoodBasedInput,
  recordedAt?: Date
): Promise<NutritionRecord> {
  await ensureUserExists(userId)

  // 獲取食物資料
  const food = await db.food.findUnique({
    where: { id: data.foodId }
  })

  if (!food) {
    throw new Error("Food not found")
  }

  // 計算營養素
  const factor = data.amount / 100
  const calories = food.caloriesPer100g * factor
  const protein = food.proteinPer100g * factor
  const carbs = food.carbsPer100g * factor
  const fat = food.fatPer100g * factor

  // Debug logging
  console.log("Creating nutrition record:", {
    hasDb: !!db,
    hasNutritionRecord: !!db?.nutritionRecord,
    dbKeys: Object.keys(db || {}),
    createMethod: typeof db?.nutritionRecord?.create
  })

  const record = await db.nutritionRecord.create({
    data: {
      userId,
      name: food.name,
      category: food.category,
      calories,
      protein,
      carbs,
      fat,
      foodId: food.id,
      amount: data.amount,
      recordedAt: recordedAt || new Date()
    }
  })

  revalidatePath("/")
  return record
}

export async function getNutritionRecordsByDate(
  userId: string,
  date: Date = new Date()
): Promise<NutritionRecordWithFood[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return await db.nutritionRecord.findMany({
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
}

export async function getNutritionRecordsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<NutritionRecordWithFood[]> {
  return await db.nutritionRecord.findMany({
    where: {
      userId,
      recordedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      food: true
    },
    orderBy: { recordedAt: "asc" }
  })
}


export async function deleteNutritionRecord(recordId: string): Promise<void> {
  await db.nutritionRecord.delete({
    where: { id: recordId }
  })

  revalidatePath("/")
}

export async function updateNutritionRecord(
  recordId: string,
  data: Partial<Omit<NutritionRecord, "id" | "userId">>
): Promise<NutritionRecord> {
  const record = await db.nutritionRecord.update({
    where: { id: recordId },
    data
  })

  revalidatePath("/")
  return record
}

export async function getRecentNutritionRecords(
  userId: string,
  limit: number = 50
): Promise<NutritionRecordWithFood[]> {
  return await db.nutritionRecord.findMany({
    where: {
      userId
    },
    include: {
      food: true
    },
    orderBy: { recordedAt: "desc" },
    take: limit
  })
}