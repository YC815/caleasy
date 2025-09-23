import type { User, Food, NutritionRecord, UserGoal, WeeklyStats } from "@prisma/client"

export type { User, Food, NutritionRecord, UserGoal, WeeklyStats }

export type FoodWithRecords = Food & {
  records: NutritionRecord[]
}

export type NutritionRecordWithFood = NutritionRecord & {
  food: Food | null
}

// Record creation types
export type DirectNutritionInput = {
  name?: string
  category: FoodCategory
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type FoodBasedInput = {
  foodId: string
  amount: number
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
  "碳水化合物",
  "其他"
] as const

export type FoodCategory = typeof FOOD_CATEGORIES[number]