"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { WeeklyStats } from "@/lib/types"

type WeeklySummaryProps = {
  weeklyStats: WeeklyStats
  targetCalories?: number
}

export function WeeklySummary({ weeklyStats, targetCalories = 2000 }: WeeklySummaryProps) {
  const goalProgress = targetCalories ? (weeklyStats.avgDailyCalories / targetCalories) * 100 : 0
  const weeklyTarget = targetCalories * 7

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">本週統計</CardTitle>
        <div className="text-sm text-muted-foreground">
          {weeklyStats.weekStartDate.toLocaleDateString("zh-TW", {
            month: "short",
            day: "numeric"
          })} - {
            new Date(weeklyStats.weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000)
              .toLocaleDateString("zh-TW", {
                month: "short",
                day: "numeric"
              })
          }
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">
              {weeklyStats.avgDailyCalories}
            </div>
            <div className="text-xs text-muted-foreground">日均熱量 (大卡)</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {weeklyStats.totalCalories}
            </div>
            <div className="text-xs text-muted-foreground">週總熱量 (大卡)</div>
          </div>
        </div>

        {targetCalories && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>目標達成率</span>
              <span>{Math.round(goalProgress)}%</span>
            </div>
            <Progress value={goalProgress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              目標: {targetCalories} 大卡/日 ({weeklyTarget} 大卡/週)
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">{weeklyStats.avgProtein}g</div>
            <div className="text-xs text-muted-foreground">日均蛋白質</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{weeklyStats.avgCarbs}g</div>
            <div className="text-xs text-muted-foreground">日均碳水</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{weeklyStats.avgFat}g</div>
            <div className="text-xs text-muted-foreground">日均脂肪</div>
          </div>
        </div>

        <div className="pt-2 border-t text-center">
          <div className="text-sm text-muted-foreground">
            本週共記錄 {weeklyStats.recordsCount} 筆飲食
          </div>
        </div>
      </CardContent>
    </Card>
  )
}