"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ensureUserExists } from "@/lib/user-utils"
import type { FoodRecord, FoodRecordWithFood } from "@/lib/types"

export async function createFoodRecord(data: {
  amount: number
  userId: string
  foodId: string
  recordedAt?: Date
}): Promise<FoodRecord> {
  // Ensure user exists
  await ensureUserExists(data.userId)

  const record = await db.foodRecord.create({
    data: {
      ...data,
      recordedAt: data.recordedAt || new Date()
    }
  })

  revalidatePath("/")
  return record
}

export async function getFoodRecordsByDate(
  userId: string,
  date: Date = new Date()
): Promise<FoodRecordWithFood[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return await db.foodRecord.findMany({
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

export async function getFoodRecordsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<FoodRecordWithFood[]> {
  return await db.foodRecord.findMany({
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


export async function deleteFoodRecord(recordId: string): Promise<void> {
  await db.foodRecord.delete({
    where: { id: recordId }
  })

  revalidatePath("/")
}

export async function updateFoodRecord(
  recordId: string,
  data: Partial<Omit<FoodRecord, "id" | "userId" | "foodId">>
): Promise<FoodRecord> {
  const record = await db.foodRecord.update({
    where: { id: recordId },
    data
  })

  revalidatePath("/")
  return record
}

export async function getRecentFoodRecords(
  userId: string,
  limit: number = 50
): Promise<FoodRecordWithFood[]> {
  return await db.foodRecord.findMany({
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