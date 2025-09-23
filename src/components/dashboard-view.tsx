"use client"

import { useState, useEffect } from "react"
import { NutritionChart } from "@/components/nutrition-chart"
import { NutritionList } from "@/components/nutrition-list"
import { AddRecordDialog } from "@/components/add-record-dialog"
import { WeeklyChart } from "@/components/weekly-chart"
import { WeeklySummary } from "@/components/weekly-summary"
import { Button } from "@/components/ui/button"
import { PieChartSkeleton, LineChartSkeleton } from "@/components/skeletons/chart-skeleton"
import { FoodListSkeleton } from "@/components/skeletons/food-list-skeleton"
import { UserButton } from "@clerk/nextjs"
import { BarChart3, History, Calendar } from "lucide-react"
import { getNutritionRecordsByDate, getRecentNutritionRecords } from "@/actions/record-actions"
import { getOrCreateWeeklyStats, getDailyCaloriesForWeek } from "@/actions/weekly-stats-actions"
import { calculateNutrition, calculateMacroRatios } from "@/lib/nutrition"
import type { NutritionRecordWithFood, MacroRatio, WeeklyStats } from "@/lib/types"

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
  const [macros, setMacros] = useState<MacroRatio[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [weeklyChart, setWeeklyChart] = useState<{ date: string; calories: number }[]>([])
  const [lastWeekChart, setLastWeekChart] = useState<{ date: string; calories: number }[]>([])


  const loadDailyData = async () => {
    try {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const todayRecs = await getNutritionRecordsByDate(userId, today)

      const todayNut = calculateNutrition(todayRecs)
      const macroData = calculateMacroRatios(todayNut)

      setMacros(macroData)
    } catch (error) {
      console.error("Error loading daily data:", error)
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
      console.error("Error loading weekly data:", error)
    }
  }

  const loadHistoryData = async () => {
    try {
      const records = await getRecentNutritionRecords(userId, 50)
      setHistoryRecords(records)
    } catch (error) {
      console.error("Error loading history data:", error)
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
                <NutritionChart macros={macros} />
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