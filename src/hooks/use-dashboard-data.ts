import { useState, useEffect, useCallback } from "react"
import { getNutritionRecordsByDate, getRecentNutritionRecords } from "@/actions/record-actions"
import { getOrCreateWeeklyStats, getDailyCaloriesForWeek } from "@/actions/weekly-stats-actions"
import { getUserGoals } from "@/actions/user-actions"
import { calculateNutrition, calculateCalorieProgress, calculateProteinProgress } from "@/lib/nutrition"
import { useUnifiedLoading } from "./use-unified-loading"
import type {
  NutritionRecordWithFood,
  WeeklyStats,
  CalorieProgressData,
  ProteinProgressData
} from "@/lib/types"

type TimeFrame = "daily" | "weekly"

interface DashboardData {
  // Daily data
  calorieProgress: CalorieProgressData
  proteinProgress: ProteinProgressData

  // Weekly data
  weeklyStats: WeeklyStats | null
  weeklyChart: { date: string; calories: number }[]
  lastWeekChart: { date: string; calories: number }[]

  // History data
  historyRecords: NutritionRecordWithFood[]
}

const DEFAULT_CALORIE_DATA: CalorieProgressData = {
  consumed: 0,
  goal: 1750,
  remaining: 1750,
  isOverGoal: false
}

const DEFAULT_PROTEIN_DATA: ProteinProgressData = {
  consumed: 0,
  goal: 100,
  isOverGoal: false
}

export function useDashboardData(userId: string, timeFrame: TimeFrame) {
  const { setLoading, isLoading } = useUnifiedLoading({
    dailyData: "idle",
    weeklyData: "idle",
    historyData: "idle"
  })

  const [data, setData] = useState<DashboardData>({
    calorieProgress: DEFAULT_CALORIE_DATA,
    proteinProgress: DEFAULT_PROTEIN_DATA,
    weeklyStats: null,
    weeklyChart: [],
    lastWeekChart: [],
    historyRecords: []
  })

  const loadDailyData = useCallback(async () => {
    if (!userId) return

    setLoading("dailyData", "loading")
    try {
      const [todayRecs, userGoals] = await Promise.all([
        getNutritionRecordsByDate(userId, new Date()),
        getUserGoals(userId)
      ])

      const todayNut = calculateNutrition(todayRecs || [])
      const calorieData = calculateCalorieProgress(todayNut.calories, userGoals.dailyCalorieGoal)
      const proteinData = calculateProteinProgress(todayNut.protein, userGoals.dailyProteinGoal)

      setData(prev => ({
        ...prev,
        calorieProgress: calorieData,
        proteinProgress: proteinData
      }))

      setLoading("dailyData", "success")
    } catch (error) {
      console.error("Failed to load daily data:", error)
      setData(prev => ({
        ...prev,
        calorieProgress: DEFAULT_CALORIE_DATA,
        proteinProgress: DEFAULT_PROTEIN_DATA
      }))
      setLoading("dailyData", "error")
    }
  }, [userId, setLoading])

  const loadWeeklyData = useCallback(async () => {
    if (!userId) return

    setLoading("weeklyData", "loading")
    try {
      const now = new Date()
      const lastWeek = new Date(now)
      lastWeek.setDate(lastWeek.getDate() - 7)

      const [stats, thisWeekData, lastWeekData] = await Promise.all([
        getOrCreateWeeklyStats(userId),
        getDailyCaloriesForWeek(userId, now),
        getDailyCaloriesForWeek(userId, lastWeek)
      ])

      setData(prev => ({
        ...prev,
        weeklyStats: stats,
        weeklyChart: thisWeekData,
        lastWeekChart: lastWeekData
      }))

      setLoading("weeklyData", "success")
    } catch (error) {
      console.error("Failed to load weekly data:", error)
      setLoading("weeklyData", "error")
    }
  }, [userId, setLoading])

  const loadHistoryData = useCallback(async () => {
    if (!userId) return

    setLoading("historyData", "loading")
    try {
      const records = await getRecentNutritionRecords(userId, 50)
      setData(prev => ({
        ...prev,
        historyRecords: records
      }))
      setLoading("historyData", "success")
    } catch (error) {
      console.error("Failed to load history data:", error)
      setLoading("historyData", "error")
    }
  }, [userId, setLoading])

  const loadData = useCallback(async () => {
    if (timeFrame === "daily") {
      await loadDailyData()
    } else {
      await loadWeeklyData()
    }
  }, [timeFrame, loadDailyData, loadWeeklyData])

  const refreshAllData = useCallback(async () => {
    await Promise.all([loadData(), loadHistoryData()])
  }, [loadData, loadHistoryData])

  useEffect(() => {
    loadData()
    loadHistoryData()
  }, [loadData, loadHistoryData])

  // 新增：午夜自動刷新機制 - 確保00:00後立即看到新的一天
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const msUntilMidnight = tomorrow.getTime() - now.getTime()

      // 在午夜後5秒自動刷新數據
      const timer = setTimeout(() => {
        console.log('[DashboardData] 午夜自動刷新數據')
        loadData()
        loadHistoryData()
      }, msUntilMidnight + 5000)

      return timer
    }

    const timer = checkMidnight()
    return () => clearTimeout(timer)
  }, [loadData, loadHistoryData])

  return {
    data,
    isLoading: (key: string) => isLoading(key),
    isAnyLoading: isLoading("dailyData") || isLoading("weeklyData") || isLoading("historyData"),
    refreshData: loadData,
    refreshAllData
  }
}