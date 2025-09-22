import { Card, CardContent } from "@/components/ui/card"
import { Flame, TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react"
import type { NutritionSummary } from "@/lib/types"
import { calculateCalorieDifference, isWithinCalorieGoal } from "@/lib/nutrition"

type CalorieSummaryProps = {
  current: NutritionSummary
  previous: number
  average: number
  target: number
  timeFrame: "daily" | "weekly"
}

export function CalorieSummary({
  current,
  previous,
  average,
  target,
  timeFrame
}: CalorieSummaryProps) {
  const isDaily = timeFrame === "daily"

  const { difference, isIncrease } = calculateCalorieDifference(current.calories, previous)
  const { difference: avgDiff, isIncrease: isAboveAvg } = calculateCalorieDifference(current.calories, average)
  const { difference: targetDiff, isIncrease: isAboveTarget } = calculateCalorieDifference(current.calories, target)

  const isOnTarget = isWithinCalorieGoal(current.calories, target)

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
      <CardContent className="p-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              {isDaily ? "今日" : "本週"}總熱量
            </span>
          </div>

          <div className="text-5xl font-bold text-primary mb-1">
            {current.calories.toLocaleString()}
          </div>
          <div className="text-lg text-muted-foreground font-medium">大卡</div>

          <div className="space-y-2 mt-4 pt-3 border-t border-primary/10">
            <div className="flex items-center justify-center gap-1">
              {isIncrease ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={`text-sm font-medium ${isIncrease ? "text-red-500" : "text-green-500"}`}>
                比{isDaily ? "昨天" : "上週"}
                {isIncrease ? "多" : "少"} {Math.abs(difference)} 大卡
              </span>
            </div>

            <div className="flex items-center justify-center gap-1">
              <BarChart3 className={`h-4 w-4 ${isAboveAvg ? "text-orange-500" : "text-blue-500"}`} />
              <span className={`text-xs ${isAboveAvg ? "text-orange-500" : "text-blue-500"}`}>
                比{isDaily ? "週" : "月"}平均{isAboveAvg ? "高" : "低"} {Math.abs(avgDiff)} 大卡
              </span>
            </div>

            <div className="flex items-center justify-center gap-1">
              <Target className={`h-4 w-4 ${isOnTarget ? "text-green-400" : isAboveTarget ? "text-red-400" : "text-yellow-400"}`} />
              <span className={`text-xs ${isOnTarget ? "text-green-400" : isAboveTarget ? "text-red-400" : "text-yellow-400"}`}>
                {isOnTarget
                  ? "已達成目標"
                  : isAboveTarget
                    ? `超出目標 ${Math.abs(targetDiff)} 大卡`
                    : `距離目標還差 ${Math.abs(targetDiff)} 大卡`
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}