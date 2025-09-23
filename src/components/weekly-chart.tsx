"use client"

import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type WeeklyChartProps = {
  thisWeekData: { date: string; calories: number }[]
  lastWeekData: { date: string; calories: number }[]
}

const chartConfig = {
  calories: {
    label: "熱量",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function WeeklyChart({ thisWeekData, lastWeekData }: WeeklyChartProps) {
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
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("zh-TW", { weekday: "short" })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("zh-TW", {
                      month: "short",
                      day: "numeric"
                    })
                  }}
                  formatter={(value, name) => [
                    `${value} 大卡`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name
                  ]}
                />
              }
            />
            <Line
              dataKey="calories"
              type="monotone"
              stroke="var(--color-calories)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-calories)",
                strokeWidth: 2,
                r: 4
              }}
              activeDot={{
                r: 6,
                stroke: "var(--color-calories)",
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            {getWeekDateRange(data)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}