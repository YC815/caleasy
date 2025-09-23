"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type WeeklyChartProps = {
  data: { date: string; calories: number }[]
  targetCalories?: number
}

export function WeeklyChart({ data, targetCalories = 2000 }: WeeklyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">週熱量趨勢</CardTitle>
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
        {targetCalories && (
          <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
            <div className="w-4 h-0.5 bg-primary mr-2"></div>
            實際攝取
            <div className="w-4 h-0.5 border-t border-dashed border-muted-foreground ml-4 mr-2"></div>
            目標 ({targetCalories} 大卡)
          </div>
        )}
      </CardContent>
    </Card>
  )
}