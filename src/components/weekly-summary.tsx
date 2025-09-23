"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, Utensils } from "lucide-react"
import type { WeeklyStats } from "@/lib/types"
import { Separator } from "@/components/ui/separator"

type WeeklySummaryProps = {
  weeklyStats: WeeklyStats
}

export function WeeklySummary({ weeklyStats }: WeeklySummaryProps) {
  const weekEnd = new Date(weeklyStats.weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">本週營養統計</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">
          {weeklyStats.weekStartDate.toLocaleDateString("zh-TW", {
            month: "short",
            day: "numeric"
          })} - {weekEnd.toLocaleDateString("zh-TW", {
            month: "short",
            day: "numeric"
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 熱量摘要 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-primary" />
            熱量攝取
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(weeklyStats.avgDailyCalories)}
                </div>
                <div className="text-xs text-muted-foreground">日均大卡</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold">
                  {weeklyStats.totalCalories.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">週總大卡</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 三大營養素 */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            日均三大營養素
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 text-center space-y-1">
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {Math.round(weeklyStats.avgProtein)}g
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-500">蛋白質</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center space-y-1">
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {Math.round(weeklyStats.avgCarbs)}g
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-500">碳水化合物</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center space-y-1">
              <div className="text-lg font-bold text-green-700 dark:text-green-400">
                {Math.round(weeklyStats.avgFat)}g
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">脂肪</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 記錄統計 */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Utensils className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            本週共記錄 <span className="font-medium text-foreground">{weeklyStats.recordsCount}</span> 筆飲食
          </span>
        </div>
      </CardContent>
    </Card>
  )
}