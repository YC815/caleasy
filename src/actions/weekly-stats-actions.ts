"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getNutritionRecordsByDateRange } from "./record-actions"
import { calculateNutrition } from "@/lib/nutrition"
import type { WeeklyStats } from "@/lib/types"

function getWeekStartDate(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
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

  console.log("[CALCULATE_WEEKLY_STATS] 開始計算週統計:", {
    userId,
    date: date.toISOString(),
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    timestamp: new Date().toISOString()
  })

  try {
    console.log("[CALCULATE_WEEKLY_STATS] 獲取週範圍記錄...")
    const records = await getNutritionRecordsByDateRange(userId, weekStart, weekEnd)

    console.log("[CALCULATE_WEEKLY_STATS] 獲取到記錄:", {
      recordsCount: records.length,
      recordIds: records.map(r => r.id),
      timestamp: new Date().toISOString()
    })

    if (records.length === 0) {
      console.log("[CALCULATE_WEEKLY_STATS] 無記錄，返回空統計:", {
        userId,
        weekStart: weekStart.toISOString(),
        timestamp: new Date().toISOString()
      })

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
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    console.log("[CALCULATE_WEEKLY_STATS] 計算總營養值...")
    const totalNutrition = calculateNutrition(records)
    const daysInWeek = 7

    const weeklyStats = {
      id: "",
      userId,
      weekStartDate: weekStart,
      totalCalories: totalNutrition.calories,
      avgDailyCalories: Math.round(totalNutrition.calories / daysInWeek),
      totalProtein: totalNutrition.protein,
      totalCarbs: totalNutrition.carbs,
      totalFat: totalNutrition.fat,
      avgProtein: Math.round(totalNutrition.protein / daysInWeek * 10) / 10,
      avgCarbs: Math.round(totalNutrition.carbs / daysInWeek * 10) / 10,
      avgFat: Math.round(totalNutrition.fat / daysInWeek * 10) / 10,
      recordsCount: records.length,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log("[CALCULATE_WEEKLY_STATS] 週統計計算完成:", {
      userId,
      weekStart: weekStart.toISOString(),
      recordsCount: records.length,
      totalNutrition,
      calculatedStats: {
        totalCalories: weeklyStats.totalCalories,
        avgDailyCalories: weeklyStats.avgDailyCalories,
        totalProtein: weeklyStats.totalProtein,
        avgProtein: weeklyStats.avgProtein
      },
      timestamp: new Date().toISOString()
    })

    return weeklyStats
  } catch (error) {
    console.error("[CALCULATE_WEEKLY_STATS] 週統計計算失敗:", {
      userId,
      date: date.toISOString(),
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function getOrCreateWeeklyStats(userId: string, date: Date = new Date()): Promise<WeeklyStats> {
  const weekStart = getWeekStartDate(date)

  console.log("[GET_OR_CREATE_WEEKLY_STATS] 開始獲取或創建週統計:", {
    userId,
    date: date.toISOString(),
    weekStart: weekStart.toISOString(),
    hasDb: !!db,
    hasWeeklyStatsModel: !!db?.weeklyStats,
    timestamp: new Date().toISOString()
  })

  try {
    console.log("[GET_OR_CREATE_WEEKLY_STATS] 查找現有週統計...")
    const existing = await db.weeklyStats.findUnique({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart
        }
      }
    })

    console.log("[GET_OR_CREATE_WEEKLY_STATS] 現有統計查詢結果:", {
      found: !!existing,
      existingId: existing?.id,
      timestamp: new Date().toISOString()
    })

    if (existing) {
      console.log("[GET_OR_CREATE_WEEKLY_STATS] 返回現有週統計:", {
        statsId: existing.id,
        totalCalories: existing.totalCalories,
        recordsCount: existing.recordsCount,
        timestamp: new Date().toISOString()
      })
      return existing
    }

    console.log("[GET_OR_CREATE_WEEKLY_STATS] 未找到現有統計，開始計算...")
    const calculated = await calculateWeeklyStats(userId, date)

    console.log("[GET_OR_CREATE_WEEKLY_STATS] 準備創建週統計記錄:", {
      calculatedStats: {
        userId: calculated.userId,
        weekStartDate: calculated.weekStartDate.toISOString(),
        totalCalories: calculated.totalCalories,
        recordsCount: calculated.recordsCount
      },
      timestamp: new Date().toISOString()
    })

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
        recordsCount: calculated.recordsCount
      }
    })

    console.log("[GET_OR_CREATE_WEEKLY_STATS] 週統計創建成功:", {
      statsId: created.id,
      userId: created.userId,
      weekStart: created.weekStartDate.toISOString(),
      totalCalories: created.totalCalories,
      recordsCount: created.recordsCount,
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
    return created
  } catch (error) {
    console.error("[GET_OR_CREATE_WEEKLY_STATS] 獲取或創建週統計失敗:", {
      userId,
      date: date.toISOString(),
      weekStart: weekStart.toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function updateWeeklyStats(userId: string, date: Date = new Date()): Promise<WeeklyStats> {
  const weekStart = getWeekStartDate(date)

  console.log("[UPDATE_WEEKLY_STATS] 開始更新週統計:", {
    userId,
    date: date.toISOString(),
    weekStart: weekStart.toISOString(),
    hasDb: !!db,
    hasWeeklyStatsModel: !!db?.weeklyStats,
    timestamp: new Date().toISOString()
  })

  try {
    console.log("[UPDATE_WEEKLY_STATS] 計算新的週統計...")
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
      recordsCount: calculated.recordsCount
    }

    const createData = {
      userId: calculated.userId,
      weekStartDate: calculated.weekStartDate,
      ...updateData
    }

    console.log("[UPDATE_WEEKLY_STATS] 準備 upsert 週統計:", {
      updateData,
      createData: {
        ...createData,
        weekStartDate: createData.weekStartDate.toISOString()
      },
      timestamp: new Date().toISOString()
    })

    const updated = await db.weeklyStats.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart
        }
      },
      update: updateData,
      create: createData
    })

    console.log("[UPDATE_WEEKLY_STATS] 週統計更新成功:", {
      statsId: updated.id,
      userId: updated.userId,
      weekStart: updated.weekStartDate.toISOString(),
      totalCalories: updated.totalCalories,
      recordsCount: updated.recordsCount,
      wasCreated: !updated.updatedAt || updated.createdAt.getTime() === updated.updatedAt.getTime(),
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
    return updated
  } catch (error) {
    console.error("[UPDATE_WEEKLY_STATS] 週統計更新失敗:", {
      userId,
      date: date.toISOString(),
      weekStart: weekStart.toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function getWeeklyStatsHistory(userId: string, weeksBack: number = 4): Promise<WeeklyStats[]> {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (weeksBack * 7))
  const weekStartFilter = getWeekStartDate(startDate)

  console.log("[GET_WEEKLY_STATS_HISTORY] 開始查詢週統計歷史:", {
    userId,
    weeksBack,
    now: now.toISOString(),
    startDate: startDate.toISOString(),
    weekStartFilter: weekStartFilter.toISOString(),
    hasDb: !!db,
    hasWeeklyStatsModel: !!db?.weeklyStats,
    timestamp: new Date().toISOString()
  })

  try {
    const stats = await db.weeklyStats.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: weekStartFilter
        }
      },
      orderBy: { weekStartDate: "asc" }
    })

    console.log("[GET_WEEKLY_STATS_HISTORY] 週統計歷史查詢成功:", {
      userId,
      weeksBack,
      statsCount: stats.length,
      dateRange: {
        earliest: stats.length > 0 ? stats[0].weekStartDate.toISOString() : null,
        latest: stats.length > 0 ? stats[stats.length - 1].weekStartDate.toISOString() : null
      },
      totalRecords: stats.reduce((sum, s) => sum + s.recordsCount, 0),
      timestamp: new Date().toISOString()
    })

    return stats
  } catch (error) {
    console.error("[GET_WEEKLY_STATS_HISTORY] 週統計歷史查詢失敗:", {
      userId,
      weeksBack,
      startDate: startDate.toISOString(),
      weekStartFilter: weekStartFilter.toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function getDailyCaloriesForWeek(userId: string, date: Date = new Date()): Promise<{ date: string; calories: number }[]> {
  const weekStart = getWeekStartDate(date)

  console.log("[GET_DAILY_CALORIES_FOR_WEEK] 開始獲取週每日卡路里:", {
    userId,
    date: date.toISOString(),
    weekStart: weekStart.toISOString(),
    timestamp: new Date().toISOString()
  })

  try {
    const dailyData: { date: string; calories: number }[] = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(currentDate.getDate() + i)

      // 使用 UTC 時間確保跨時區一致性
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayStart = new Date(dateStr + 'T00:00:00.000Z')
      const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

      console.log(`[GET_DAILY_CALORIES_FOR_WEEK] 查詢第${i + 1}天 (${currentDate.toISOString().split('T')[0]}) 記錄...`)
      const dayRecords = await getNutritionRecordsByDateRange(userId, dayStart, dayEnd)
      const dayNutrition = calculateNutrition(dayRecords)

      const dayData = {
        date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
        calories: dayNutrition.calories
      }

      console.log(`[GET_DAILY_CALORIES_FOR_WEEK] 第${i + 1}天結果:`, {
        date: dayData.date,
        calories: dayData.calories,
        recordsCount: dayRecords.length,
        timestamp: new Date().toISOString()
      })

      dailyData.push(dayData)
    }

    console.log("[GET_DAILY_CALORIES_FOR_WEEK] 週每日卡路里獲取成功:", {
      userId,
      weekStart: weekStart.toISOString(),
      totalDays: dailyData.length,
      totalCalories: dailyData.reduce((sum, d) => sum + d.calories, 0),
      avgDailyCalories: Math.round(dailyData.reduce((sum, d) => sum + d.calories, 0) / dailyData.length),
      dailyBreakdown: dailyData,
      timestamp: new Date().toISOString()
    })

    return dailyData
  } catch (error) {
    console.error("[GET_DAILY_CALORIES_FOR_WEEK] 週每日卡路里獲取失敗:", {
      userId,
      date: date.toISOString(),
      weekStart: weekStart.toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}