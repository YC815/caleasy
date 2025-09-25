"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, Utensils } from "lucide-react"
import type { WeeklyStats } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { timeManager } from "@/lib/time"

type WeeklySummaryProps = {
  weeklyStats: WeeklyStats
}

export function WeeklySummary({ weeklyStats }: WeeklySummaryProps) {

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">本週營養統計</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">
          {timeManager.formatWeeklyRange(weeklyStats.weekStartDate)}
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
                  {weeklyStats.avgDailyCalories.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">日均大卡</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold">
                  {weeklyStats.totalCalories.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">週總大卡</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 蛋白質攝取 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-primary" />
            蛋白質攝取
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {weeklyStats.avgProtein.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">日均公克</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold">
                  {weeklyStats.totalProtein.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">週總公克</div>
              </div>
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