import { NutritionProgress } from "@/components/nutrition-progress"
import { NutritionList } from "@/components/nutrition-list"
import { WeeklyChart } from "@/components/weekly-chart"
import { WeeklySummary } from "@/components/weekly-summary"
import { DashboardSkeleton, ListSkeleton } from "@/components/skeletons"
import { timeManager } from "@/lib/time"
import Image from "next/image"
import type {
  NutritionRecordWithFood,
  WeeklyStats,
  CalorieProgressData,
  ProteinProgressData
} from "@/lib/types"

type ViewMode = "overview" | "history"
type TimeFrame = "daily" | "weekly"

interface DashboardContentProps {
  viewMode: ViewMode
  timeFrame: TimeFrame
  data: {
    calorieProgress: CalorieProgressData
    proteinProgress: ProteinProgressData
    weeklyStats: WeeklyStats | null
    weeklyChart: { date: string; calories: number }[]
    lastWeekChart: { date: string; calories: number }[]
    historyRecords: NutritionRecordWithFood[]
  }
  isLoading: (key: string) => boolean
  onGoalsUpdate: () => void
  onRecordChange: () => void
}

export function DashboardContent({
  viewMode,
  timeFrame,
  data,
  isLoading,
  onGoalsUpdate,
  onRecordChange
}: DashboardContentProps) {
  // History view
  if (viewMode === "history") {
    if (isLoading("historyData")) {
      return <ListSkeleton variant="history" />
    }

    return (
      <NutritionList
        records={data.historyRecords}
        showGroupedByDate={true}
        onRecordChange={onRecordChange}
      />
    )
  }

  // Overview view
  if (timeFrame === "daily") {
    if (isLoading("dailyData")) {
      return <DashboardSkeleton variant="daily" />
    }

    return (
      <>
        <NutritionProgress
          calorieData={data.calorieProgress}
          proteinData={data.proteinProgress}
          onGoalsUpdate={onGoalsUpdate}
        />

        {/* 當前時間確認 */}
        <div className="text-center text-xs text-muted-foreground">
          當前時間: {timeManager.formatDateTime(timeManager.now())}
        </div>

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
    )
  }

  // Weekly view
  if (isLoading("weeklyData")) {
    return <DashboardSkeleton variant="weekly" />
  }

  return (
    <>
      {data.weeklyStats && (
        <WeeklySummary weeklyStats={data.weeklyStats} />
      )}

      <WeeklyChart
        thisWeekData={data.weeklyChart}
        lastWeekData={data.lastWeekChart}
      />

      {data.weeklyStats && (
        <div className="text-center text-sm text-muted-foreground">
          點擊「記錄歷史」查看詳細飲食記錄
        </div>
      )}
    </>
  )
}