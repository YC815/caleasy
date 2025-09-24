"use client"

import { useState, useEffect } from "react"
import { NutritionProgress } from "@/components/nutrition-progress"
import { NutritionList } from "@/components/nutrition-list"
import { AddRecordDialog } from "@/components/add-record-dialog"
import { WeeklyChart } from "@/components/weekly-chart"
import { WeeklySummary } from "@/components/weekly-summary"
import { Button } from "@/components/ui/button"
import { PieChartSkeleton, LineChartSkeleton } from "@/components/skeletons/chart-skeleton"
import { FoodListSkeleton } from "@/components/skeletons/food-list-skeleton"
import { UserButton } from "@clerk/nextjs"
import { BarChart3, History, Calendar } from "lucide-react"
import Image from "next/image"
import { getNutritionRecordsByDate, getRecentNutritionRecords } from "@/actions/record-actions"
import { getOrCreateWeeklyStats, getDailyCaloriesForWeek } from "@/actions/weekly-stats-actions"
import { getUserGoals } from "@/actions/user-actions"
import { calculateNutrition, calculateCalorieProgress, calculateProteinProgress } from "@/lib/nutrition"
import type { NutritionRecordWithFood, WeeklyStats, CalorieProgressData, ProteinProgressData } from "@/lib/types"

type ViewMode = "overview" | "history"
type TimeFrame = "daily" | "weekly"

type DashboardViewProps = {
  userId: string
}

export function DashboardView({ userId }: DashboardViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily")
  const [isLoading, setIsLoading] = useState(true)

  const [historyRecords, setHistoryRecords] = useState<NutritionRecordWithFood[]>([])
  const [calorieProgress, setCalorieProgress] = useState<CalorieProgressData>({
    consumed: 0,
    goal: 1750,
    remaining: 1750,
    isOverGoal: false
  })
  const [proteinProgress, setProteinProgress] = useState<ProteinProgressData>({
    consumed: 0,
    goal: 100,
    isOverGoal: false
  })
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [weeklyChart, setWeeklyChart] = useState<{ date: string; calories: number }[]>([])
  const [lastWeekChart, setLastWeekChart] = useState<{ date: string; calories: number }[]>([])


  const loadDailyData = async () => {
    try {
      const [todayRecs, userGoals] = await Promise.all([
        getNutritionRecordsByDate(userId, new Date()),
        getUserGoals(userId)
      ])

      const todayNut = calculateNutrition(todayRecs || [])

      const calorieData = calculateCalorieProgress(todayNut.calories, userGoals.dailyCalorieGoal)
      const proteinData = calculateProteinProgress(todayNut.protein, userGoals.dailyProteinGoal)

      setCalorieProgress(calorieData)
      setProteinProgress(proteinData)
    } catch (error) {
      console.error("Failed to load daily data:", error)
      // 設定預設的空狀態
      setCalorieProgress({
        consumed: 0,
        goal: 1750,
        remaining: 1750,
        isOverGoal: false
      })
      setProteinProgress({
        consumed: 0,
        goal: 100,
        isOverGoal: false
      })
    }
  }

  const loadWeeklyData = async () => {
    try {
      const now = new Date()
      const lastWeek = new Date(now)
      lastWeek.setDate(lastWeek.getDate() - 7)

      const [stats, thisWeekData, lastWeekData] = await Promise.all([
        getOrCreateWeeklyStats(userId),
        getDailyCaloriesForWeek(userId, now),
        getDailyCaloriesForWeek(userId, lastWeek)
      ])

      setWeeklyStats(stats)
      setWeeklyChart(thisWeekData)
      setLastWeekChart(lastWeekData)
    } catch (error) {
      console.error("Failed to load weekly data:", error)
    }
  }

  const loadHistoryData = async () => {
    try {
      const records = await getRecentNutritionRecords(userId, 50)
      setHistoryRecords(records)
    } catch (error) {
      console.error("Failed to load history data:", error)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (timeFrame === "daily") {
        await loadDailyData()
      } else {
        await loadWeeklyData()
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadHistoryData()
  }, [timeFrame, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddFoodSuccess = () => {
    loadData()
    loadHistoryData()
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={viewMode === "overview" ? "default" : "ghost"}
                size="sm"
                className="px-3"
                disabled
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                總覽
              </Button>
              <Button
                variant={viewMode === "history" ? "default" : "ghost"}
                size="sm"
                className="px-3"
                disabled
              >
                <History className="h-4 w-4 mr-1" />
                記錄歷史
              </Button>
            </div>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>

        <div className="p-4 pb-20 space-y-6">
          {viewMode === "overview" && (
            <>
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={timeFrame === "daily" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  disabled
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  每日
                </Button>
                <Button
                  variant={timeFrame === "weekly" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  disabled
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  每週
                </Button>
              </div>

              {timeFrame === "daily" ? (
                <>
                  <PieChartSkeleton />
                </>
              ) : (
                <>
                  <LineChartSkeleton />
                </>
              )}
            </>
          )}

          {viewMode === "history" && (
            <FoodListSkeleton />
          )}
        </div>

        <AddRecordDialog onSuccess={handleAddFoodSuccess} />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "overview" ? "default" : "ghost"}
              size="sm"
              className="px-3"
              onClick={() => setViewMode("overview")}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              總覽
            </Button>
            <Button
              variant={viewMode === "history" ? "default" : "ghost"}
              size="sm"
              className="px-3"
              onClick={() => setViewMode("history")}
            >
              <History className="h-4 w-4 mr-1" />
              記錄歷史
            </Button>
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </div>

      <div className="p-4 pb-20 space-y-6">
        {viewMode === "overview" && (
          <>
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={timeFrame === "daily" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setTimeFrame("daily")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                每日
              </Button>
              <Button
                variant={timeFrame === "weekly" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setTimeFrame("weekly")}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                每週
              </Button>
            </div>

            {timeFrame === "daily" ? (
              <>
                <NutritionProgress
                  calorieData={calorieProgress}
                  proteinData={proteinProgress}
                  onGoalsUpdate={loadData}
                />

                {/* 主畫面照片 */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden border shadow-lg">
                    <Image
                      src="/small_li_li.png"
                      alt="Profile"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {weeklyStats && (
                  <WeeklySummary
                    weeklyStats={weeklyStats}
                  />
                )}

                <WeeklyChart
                  thisWeekData={weeklyChart}
                  lastWeekData={lastWeekChart}
                />

                {weeklyStats && (
                  <div className="text-center text-sm text-muted-foreground">
                    點擊「記錄歷史」查看詳細飲食記錄
                  </div>
                )}
              </>
            )}
          </>
        )}

        {viewMode === "history" && (
          <NutritionList
            records={historyRecords}
            showGroupedByDate={true}
            onRecordChange={() => {
              loadData()
              loadHistoryData()
            }}
          />
        )}
      </div>

      <AddRecordDialog onSuccess={handleAddFoodSuccess} />
    </div>
  )
}