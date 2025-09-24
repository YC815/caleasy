"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getNutritionRecordsByDateRange } from "./record-actions"
import { calculateNutrition } from "@/lib/nutrition"
import { ensureUserExists } from "@/lib/user-utils"
import type { WeeklyStats } from "@/lib/types"

function getWeekStartDate(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekEndDate(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

export async function calculateWeeklyStats(userId: string, date: Date = new Date()): Promise<WeeklyStats> {
  const weekStart = getWeekStartDate(date)
  const weekEnd = getWeekEndDate(weekStart)

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
        totalCarbs: 0,
        totalFat: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        recordsCount: 0,
        actualDays: 0,
        createdAt: new Date(),
        updatedAt: new Date()
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
      totalCarbs: totalNutrition.carbs,
      totalFat: totalNutrition.fat,
      avgProtein: totalNutrition.protein / actualDays,
      avgCarbs: totalNutrition.carbs / actualDays,
      avgFat: totalNutrition.fat / actualDays,
      recordsCount: records.length,
      actualDays,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error("週統計計算失敗:", error)
    throw error
  }
}

export async function getOrCreateWeeklyStats(userId: string, date: Date = new Date()): Promise<WeeklyStats> {
  const weekStart = getWeekStartDate(date)

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
        totalCarbs: calculated.totalCarbs,
        totalFat: calculated.totalFat,
        avgProtein: calculated.avgProtein,
        avgCarbs: calculated.avgCarbs,
        avgFat: calculated.avgFat,
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

export async function updateWeeklyStats(userId: string, date: Date = new Date()): Promise<WeeklyStats> {
  const weekStart = getWeekStartDate(date)

  try {
    await ensureUserExists(userId)
    const calculated = await calculateWeeklyStats(userId, date)

    const updateData = {
      totalCalories: calculated.totalCalories,
      avgDailyCalories: calculated.avgDailyCalories,
      totalProtein: calculated.totalProtein,
      totalCarbs: calculated.totalCarbs,
      totalFat: calculated.totalFat,
      avgProtein: calculated.avgProtein,
      avgCarbs: calculated.avgCarbs,
      avgFat: calculated.avgFat,
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
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeksBack * 7))
  const weekStartFilter = getWeekStartDate(startDate)

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

export async function getDailyCaloriesForWeek(userId: string, date: Date = new Date()): Promise<{ date: string; calories: number }[]> {
  const weekStart = getWeekStartDate(date)

  try {
    await ensureUserExists(userId)

    const dailyData: { date: string; calories: number }[] = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(currentDate.getDate() + i)

      const dateStr = currentDate.toISOString().split('T')[0]
      const dayStart = new Date(dateStr + 'T00:00:00.000Z')
      const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

      const dayRecords = await getNutritionRecordsByDateRange(userId, dayStart, dayEnd)
      const dayNutrition = calculateNutrition(dayRecords)

      dailyData.push({
        date: dateStr,
        calories: dayNutrition.calories
      })
    }

    return dailyData
  } catch (error) {
    console.error("週每日卡路里獲取失敗:", error)
    throw error
  }
}