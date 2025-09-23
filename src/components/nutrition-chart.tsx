"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { MacroRatio } from "@/lib/types"

type NutritionChartProps = {
  macros: MacroRatio[]
}

const chartConfig = {
  value: {
    label: "百分比",
  },
} satisfies ChartConfig

export function NutritionChart({ macros }: NutritionChartProps) {
  const totalCalories = React.useMemo(() => {
    return macros.reduce((acc, curr) => acc + curr.calories, 0)
  }, [macros])

  if (!macros.length) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-lg">營養素比例</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            尚無飲食記錄
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">營養素比例</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _, props) => [
                    `${value}% (${props.payload.calories} 大卡)`,
                    props.payload.name
                  ]}
                />
              }
            />
            <Pie
              data={macros}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {macros.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalCalories.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          大卡
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <div className="flex flex-col gap-2 p-4 pt-0">
        {macros.map((macro, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-sm font-medium">{macro.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{macro.value}%</div>
              <div className="text-xs text-muted-foreground">{macro.calories} 大卡</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}