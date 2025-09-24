import type { NutritionRecord, NutritionRecordWithFood, NutritionSummary, MacroRatio, CalorieProgressData, ProteinProgressData } from "./types"

export function calculateNutrition(records: NutritionRecord[] | NutritionRecordWithFood[]): NutritionSummary {
  return records.reduce(
    (total, record) => ({
      calories: total.calories + record.calories,
      protein: total.protein + record.protein
    }),
    { calories: 0, protein: 0 }
  )
}

export function calculateMacroRatios(nutrition: NutritionSummary): MacroRatio[] {
  const proteinCalories = nutrition.protein * 4
  const otherCalories = nutrition.calories - proteinCalories

  // 處理空資料情況
  if (nutrition.calories === 0) {
    return [
      {
        name: "蛋白質",
        value: 0,
        calories: 0,
        color: "#1e40af"
      },
      {
        name: "其他",
        value: 0,
        calories: 0,
        color: "#60a5fa"
      }
    ]
  }

  const proteinPercent = Math.round((proteinCalories / nutrition.calories) * 100)
  const otherPercent = 100 - proteinPercent

  return [
    {
      name: "蛋白質",
      value: proteinPercent,
      calories: Math.round(proteinCalories),
      color: "#1e40af"
    },
    {
      name: "其他",
      value: otherPercent,
      calories: Math.round(otherCalories),
      color: "#60a5fa"
    }
  ]
}

export function calculateCalorieDifference(current: number, previous: number): {
  difference: number
  isIncrease: boolean
  percentage: number
} {
  const difference = current - previous
  const isIncrease = difference > 0
  const percentage = previous > 0 ? Math.round((Math.abs(difference) / previous) * 100) : 0

  return { difference, isIncrease, percentage }
}

export function isWithinCalorieGoal(current: number, target: number, tolerance = 0.1): boolean {
  const variance = Math.abs(current - target) / target
  return variance <= tolerance
}

export function calculateCalorieProgress(consumed: number, goal: number): CalorieProgressData {
  const remaining = goal - consumed
  const isOverGoal = consumed > goal

  return {
    consumed,
    goal,
    remaining: isOverGoal ? Math.abs(remaining) : remaining,
    isOverGoal,
  }
}

export function calculateProteinProgress(consumed: number, goal: number): ProteinProgressData {
  const isOverGoal = consumed > goal
  const overAmount = isOverGoal ? Math.round(consumed - goal) : undefined

  return {
    consumed,
    goal,
    isOverGoal,
    overAmount,
  }
}