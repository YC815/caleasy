import type { User, Food, FoodRecord, UserGoal, WeeklyStats } from "@prisma/client"

export type { User, Food, FoodRecord, UserGoal, WeeklyStats }

export type FoodWithRecords = Food & {
  records: FoodRecord[]
}

export type FoodRecordWithFood = FoodRecord & {
  food: Food
}

export type NutritionSummary = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MacroRatio = {
  name: string
  value: number
  calories: number
  color: string
}

export type TimeFrame = "daily" | "weekly"

export type ViewMode = "overview" | "history"

export const FOOD_CATEGORIES = [
  "蛋白質",
  "蔬果與纖維",
  "碳水化合物"
] as const

export type FoodCategory = typeof FOOD_CATEGORIES[number]