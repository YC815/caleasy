"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getFoodRecordsByDateRange } from "./record-actions"
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

  const records = await getFoodRecordsByDateRange(userId, weekStart, weekEnd)

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
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  const totalNutrition = calculateNutrition(records)
  const daysInWeek = 7

  return {
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
}

export async function getOrCreateWeeklyStats(userId: string, date: Date = new Date()): Promise<WeeklyStats> {
  const weekStart = getWeekStartDate(date)

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
      recordsCount: calculated.recordsCount
    }
  })

  revalidatePath("/")
  return created
}

export async function updateWeeklyStats(userId: string, date: Date = new Date()): Promise<WeeklyStats> {
  const weekStart = getWeekStartDate(date)
  const calculated = await calculateWeeklyStats(userId, date)

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
      totalCarbs: calculated.totalCarbs,
      totalFat: calculated.totalFat,
      avgProtein: calculated.avgProtein,
      avgCarbs: calculated.avgCarbs,
      avgFat: calculated.avgFat,
      recordsCount: calculated.recordsCount
    },
    create: {
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

  revalidatePath("/")
  return updated
}

export async function getWeeklyStatsHistory(userId: string, weeksBack: number = 4): Promise<WeeklyStats[]> {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (weeksBack * 7))

  return await db.weeklyStats.findMany({
    where: {
      userId,
      weekStartDate: {
        gte: getWeekStartDate(startDate)
      }
    },
    orderBy: { weekStartDate: "asc" }
  })
}

export async function getDailyCaloriesForWeek(userId: string, date: Date = new Date()): Promise<{ date: string; calories: number }[]> {
  const weekStart = getWeekStartDate(date)

  const dailyData: { date: string; calories: number }[] = []

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart)
    currentDate.setDate(currentDate.getDate() + i)

    const dayRecords = await getFoodRecordsByDateRange(userId, currentDate, currentDate)
    const dayNutrition = calculateNutrition(dayRecords)

    dailyData.push({
      date: currentDate.toLocaleDateString("zh-TW", { weekday: "short" }),
      calories: dayNutrition.calories
    })
  }

  return dailyData
}