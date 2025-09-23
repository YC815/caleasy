"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type WeeklyChartProps = {
  thisWeekData: { date: string; calories: number }[]
  lastWeekData: { date: string; calories: number }[]
  targetCalories?: number
}

export function WeeklyChart({ thisWeekData, lastWeekData, targetCalories = 2000 }: WeeklyChartProps) {
  const [isThisWeek, setIsThisWeek] = useState(true)
  const data = isThisWeek ? thisWeekData : lastWeekData

  const getWeekDateRange = (weekData: { date: string; calories: number }[]) => {
    if (weekData.length === 0) return ""
    const firstDate = new Date(weekData[0].date)
    const lastDate = new Date(weekData[weekData.length - 1].date)

    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }

    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">週熱量趨勢</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={!isThisWeek ? "default" : "outline"}
              size="sm"
              onClick={() => setIsThisWeek(false)}
            >
              上週
            </Button>
            <Button
              variant={isThisWeek ? "default" : "outline"}
              size="sm"
              onClick={() => setIsThisWeek(true)}
            >
              本週
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("zh-TW", { weekday: "short" })
                }}
              />
              <YAxis
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-sm">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          熱量: {payload[0].value} 大卡
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
              {targetCalories && (
                <Line
                  type="monotone"
                  dataKey={() => targetCalories}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            {getWeekDateRange(data)}
          </div>
          {targetCalories && (
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <div className="w-4 h-0.5 bg-primary mr-2"></div>
              實際攝取
              <div className="w-4 h-0.5 border-t border-dashed border-muted-foreground ml-4 mr-2"></div>
              目標 ({targetCalories} 大卡)
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}