"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GoalsSettingDialog } from "@/components/goals-setting-dialog"
import { Flame, Zap } from "lucide-react"
import type { CalorieProgressData, ProteinProgressData } from "@/lib/types"

type NutritionProgressProps = {
  calorieData: CalorieProgressData
  proteinData: ProteinProgressData
  onGoalsUpdate?: () => void
}

export function NutritionProgress({ calorieData, proteinData, onGoalsUpdate }: NutritionProgressProps) {
  // 熱量進度條：從滿血開始倒扣
  const caloriePercentage = calorieData.isOverGoal
    ? 0  // 超標時進度條為空（紅色）
    : Math.max(0, (calorieData.remaining / calorieData.goal) * 100)

  // 蛋白質進度條：正常累積模式
  const proteinPercentage = Math.min((proteinData.consumed / proteinData.goal) * 100, 100)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">今日營養攝取</CardTitle>
          <GoalsSettingDialog onUpdate={onGoalsUpdate} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 剩餘熱量進度條 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">剩餘熱量</span>
            </div>
            <div className="text-right">
              {calorieData.isOverGoal ? (
                <span className="text-sm font-semibold text-red-500">
                  超標 {Math.abs(calorieData.remaining)} kcal
                </span>
              ) : (
                <span className="text-sm font-semibold">
                  剩餘 {calorieData.remaining} kcal
                </span>
              )}
            </div>
          </div>

          <Progress
            value={caloriePercentage}
            className={`h-3 ${calorieData.isOverGoal ? '[&>div]:bg-red-500 bg-red-100' : '[&>div]:bg-green-500'}`}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{calorieData.consumed} / {calorieData.goal} kcal</span>
            <span>{calorieData.isOverGoal ? '超標' : `剩餘 ${Math.round(caloriePercentage)}%`}</span>
          </div>
        </div>

        {/* 蛋白質進度條 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">蛋白質</span>
            </div>
            <div className="text-right">
              {proteinData.isOverGoal ? (
                <span className="text-sm font-semibold text-green-500">
                  多攝取 {proteinData.overAmount}g 蛋白質
                </span>
              ) : (
                <span className="text-sm font-semibold">
                  {Math.round(proteinData.consumed)} / {proteinData.goal}g
                </span>
              )}
            </div>
          </div>

          <Progress
            value={proteinPercentage}
            className={`h-3 ${proteinData.isOverGoal ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'}`}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(proteinData.consumed)} / {proteinData.goal}g</span>
            <span>{Math.round(proteinPercentage)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}