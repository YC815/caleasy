"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { AddRecordDialog } from "@/components/add-record-dialog"
import { useDashboardData } from "@/hooks/use-dashboard-data"

type ViewMode = "overview" | "history"
type TimeFrame = "daily" | "weekly"

type DashboardViewProps = {
  userId: string
}

export function DashboardView({ userId }: DashboardViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily")

  const { data, isLoading, isAnyLoading, refreshData, refreshAllData } = useDashboardData(userId, timeFrame)

  const handleAddFoodSuccess = () => {
    refreshAllData()
  }

  const handleRecordChange = () => {
    refreshAllData()
  }

  return (
    <>
      <DashboardShell
        viewMode={viewMode}
        timeFrame={timeFrame}
        onViewModeChange={setViewMode}
        onTimeFrameChange={setTimeFrame}
        isLoading={isAnyLoading}
      >
        <DashboardContent
          viewMode={viewMode}
          timeFrame={timeFrame}
          data={data}
          isLoading={isLoading}
          onGoalsUpdate={refreshData}
          onRecordChange={handleRecordChange}
        />
      </DashboardShell>

      <AddRecordDialog onSuccess={handleAddFoodSuccess} />
    </>
  )
}