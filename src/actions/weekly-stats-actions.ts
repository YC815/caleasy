"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getNutritionRecordsByDateRange } from "./record-actions"
import { calculateNutrition } from "@/lib/nutrition"
import { ensureUserExists } from "@/lib/user-utils"
import { timeManager } from "@/lib/time"
import type { WeeklyStats } from "@/lib/types"


export async function calculateWeeklyStats(userId: string, date: Date = timeManager.now()): Promise<WeeklyStats> {
  const weekStart = timeManager.getWeekStartDate(date)
  const weekEnd = timeManager.getWeekEndDate(weekStart)


  try {
    // 直接查詢週範圍內的所有記錄，簡化邊界計算
    const records = await db.nutritionRecord.findMany({
      where: {
        userId,
        recordedAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        food: true
      },
      orderBy: { recordedAt: "asc" }
    })

    console.log(`[WEEKLY_STATS] ${timeManager.formatWeeklyRange(weekStart)}: ${records.length} 筆記錄`)

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

    const result = {
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


    return result
  } catch (error) {
    console.error("週統計計算失敗:", error)
    throw error
  }
}

export async function getOrCreateWeeklyStats(userId: string, date: Date = timeManager.now()): Promise<WeeklyStats> {
  const weekStart = timeManager.getWeekStartDate(date)

  try {
    await ensureUserExists(userId)

    // 強制重新計算最新數據，不依賴緩存
    const calculated = await calculateWeeklyStats(userId, date)

    // 使用 upsert 確保數據是最新的
    const updated = await db.weeklyStats.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart
        }
      },
      update: {
        totalCalories: calculated.totalCalories,
        avgDailyCalories: calculated.avgDailyCalories,
        totalProtein: calculated.totalProtein,
        avgProtein: calculated.avgProtein,
        recordsCount: calculated.recordsCount,
        actualDays: calculated.actualDays
      },
      create: {
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
    return updated
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

export async function recalculateAllWeeklyStats(userId: string): Promise<{ recalculated: number; errors: number }> {
  console.log(`[RECALCULATE_WEEKLY_STATS] 開始重新計算用戶 ${userId} 的所有週統計`)

  try {
    await ensureUserExists(userId)

    // 刪除所有現有的週統計
    const deletedCount = await db.weeklyStats.deleteMany({
      where: { userId }
    })

    console.log(`[RECALCULATE_WEEKLY_STATS] 已刪除 ${deletedCount.count} 個舊統計`)

    // 獲取用戶最早的記錄日期
    const firstRecord = await db.nutritionRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: "asc" }
    })

    if (!firstRecord) {
      console.log(`[RECALCULATE_WEEKLY_STATS] 用戶 ${userId} 沒有營養記錄`)
      return { recalculated: 0, errors: 0 }
    }

    let recalculated = 0
    let errors = 0

    // 從第一筆記錄的週開始，重新計算到本週
    const firstWeekStart = timeManager.getWeekStartDate(firstRecord.recordedAt)
    const currentWeekStart = timeManager.getWeekStartDate(timeManager.now())

    const currentDate = new Date(firstWeekStart)

    while (currentDate <= currentWeekStart) {
      try {
        const calculated = await calculateWeeklyStats(userId, currentDate)

        // 只有在有記錄時才創建統計
        if (calculated.recordsCount > 0) {
          await db.weeklyStats.create({
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

          console.log(`[RECALCULATE_WEEKLY_STATS] 週 ${timeManager.getDateString(currentDate)}: ${calculated.recordsCount} 筆記錄`)
          recalculated++
        }
      } catch (error) {
        console.error(`[RECALCULATE_WEEKLY_STATS] 週 ${timeManager.getDateString(currentDate)} 計算失敗:`, error)
        errors++
      }

      // 移到下一週
      currentDate.setDate(currentDate.getDate() + 7)
    }

    revalidatePath("/")

    console.log(`[RECALCULATE_WEEKLY_STATS] 完成重新計算: ${recalculated} 個週統計, ${errors} 個錯誤`)
    return { recalculated, errors }

  } catch (error) {
    console.error("[RECALCULATE_WEEKLY_STATS] 重新計算失敗:", error)
    throw error
  }
}