"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getNutritionRecordsByDateRange } from "./record-actions"
import { calculateNutrition } from "@/lib/nutrition"
import { ensureUserExists } from "@/lib/user-utils"
import { timeManager } from "@/lib/time"
import type { WeeklyStats } from "@/lib/types"


export async function calculateWeeklyStats(userId: string, date: Date = timeManager.now()): Promise<WeeklyStats> {
  const { start: weekStart, end: weekEnd } = timeManager.getWeekBounds(date)

  try {
    const records = await getNutritionRecordsByDateRange(userId, weekStart, weekEnd)

    if (records.length === 0) {
      return {
        id: "",
        userId,
        weekStartDate: weekStart,
        totalCalories: 0,
        avgDailyCalories: 0,
        totalProtein: 0,
        avgProtein: 0,
        recordsCount: 0,
        actualDays: 0,
        createdAt: timeManager.now(),
        updatedAt: timeManager.now()
      }
    }

    const totalNutrition = calculateNutrition(records)
    const actualDays = new Set(records.map(r => r.recordedAt.toISOString().split('T')[0])).size

    return {
      id: "",
      userId,
      weekStartDate: weekStart,
      totalCalories: totalNutrition.calories,
      avgDailyCalories: totalNutrition.calories / actualDays,
      totalProtein: totalNutrition.protein,
      avgProtein: totalNutrition.protein / actualDays,
      recordsCount: records.length,
      actualDays,
      createdAt: timeManager.now(),
      updatedAt: timeManager.now()
    }
  } catch (error) {
    console.error("週統計計算失敗:", error)
    throw error
  }
}

export async function getOrCreateWeeklyStats(userId: string, date: Date = timeManager.now()): Promise<WeeklyStats> {
  const weekStart = timeManager.getWeekStartDate(date)

  try {
    await ensureUserExists(userId)

    const existing = await db.weeklyStats.findUnique({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart
        }
      }
    })

    if (existing) {
      return existing
    }

    const calculated = await calculateWeeklyStats(userId, date)
    const created = await db.weeklyStats.create({
      data: {
        userId: calculated.userId,
        weekStartDate: calculated.weekStartDate,
        totalCalories: calculated.totalCalories,
        avgDailyCalories: calculated.avgDailyCalories,
        totalProtein: calculated.totalProtein,
        avgProtein: calculated.avgProtein,
        recordsCount: calculated.recordsCount,
        actualDays: calculated.actualDays
      }
    })

    revalidatePath("/")
    return created
  } catch (error) {
    console.error("獲取或創建週統計失敗:", error)
    throw error
  }
}

export async function updateWeeklyStats(userId: string, date: Date = timeManager.now()): Promise<WeeklyStats> {
  const weekStart = timeManager.getWeekStartDate(date)

  try {
    await ensureUserExists(userId)
    const calculated = await calculateWeeklyStats(userId, date)

    const updateData = {
      totalCalories: calculated.totalCalories,
      avgDailyCalories: calculated.avgDailyCalories,
      totalProtein: calculated.totalProtein,
      avgProtein: calculated.avgProtein,
      recordsCount: calculated.recordsCount,
      actualDays: calculated.actualDays
    }

    const updated = await db.weeklyStats.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart
        }
      },
      update: updateData,
      create: {
        userId: calculated.userId,
        weekStartDate: calculated.weekStartDate,
        ...updateData
      }
    })

    revalidatePath("/")
    return updated
  } catch (error) {
    console.error("週統計更新失敗:", error)
    throw error
  }
}

export async function getWeeklyStatsHistory(userId: string, weeksBack: number = 4): Promise<WeeklyStats[]> {
  const startDate = timeManager.now()
  startDate.setDate(startDate.getDate() - (weeksBack * 7))
  const weekStartFilter = timeManager.getWeekStartDate(startDate)

  try {
    await ensureUserExists(userId)

    return await db.weeklyStats.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: weekStartFilter
        }
      },
      orderBy: { weekStartDate: "asc" }
    })
  } catch (error) {
    console.error("週統計歷史查詢失敗:", error)
    throw error
  }
}

export async function getDailyCaloriesForWeek(userId: string, date: Date = timeManager.now()): Promise<{ date: string; calories: number }[]> {
  const weekStart = timeManager.getWeekStartDate(date)

  try {
    await ensureUserExists(userId)

    const dailyData: { date: string; calories: number }[] = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(currentDate.getDate() + i)

      const { start: dayStart, end: dayEnd } = timeManager.getDayBounds(currentDate)
      const dayRecords = await getNutritionRecordsByDateRange(userId, dayStart, dayEnd)
      const dayNutrition = calculateNutrition(dayRecords)

      dailyData.push({
        date: timeManager.getDateString(currentDate),
        calories: dayNutrition.calories
      })
    }

    return dailyData
  } catch (error) {
    console.error("週每日卡路里獲取失敗:", error)
    throw error
  }
}