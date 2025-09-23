import type { FoodRecordWithFood, NutritionSummary, MacroRatio } from "./types"

export function calculateNutrition(records: FoodRecordWithFood[]): NutritionSummary {
  return records.reduce(
    (total, record) => {
      const factor = record.amount / 100

      return {
        calories: total.calories + (record.food.caloriesPer100g * factor),
        protein: total.protein + (record.food.proteinPer100g * factor),
        carbs: total.carbs + (record.food.carbsPer100g * factor),
        fat: total.fat + (record.food.fatPer100g * factor)
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function calculateMacroRatios(nutrition: NutritionSummary): MacroRatio[] {
  const total = nutrition.calories || 1

  return [
    {
      name: "碳水化合物",
      value: Math.round((nutrition.carbs * 4 / total) * 100),
      calories: Math.round(nutrition.carbs * 4),
      color: "#3b82f6"
    },
    {
      name: "蛋白質",
      value: Math.round((nutrition.protein * 4 / total) * 100),
      calories: Math.round(nutrition.protein * 4),
      color: "#1e40af"
    },
    {
      name: "脂肪",
      value: Math.round((nutrition.fat * 9 / total) * 100),
      calories: Math.round(nutrition.fat * 9),
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