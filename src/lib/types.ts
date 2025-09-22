import type { User, Food, FoodRecord, UserGoal } from "@prisma/client"

export type { User, Food, FoodRecord, UserGoal }

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

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export type TimeFrame = "daily" | "weekly"

export type ViewMode = "overview" | "history"

export const MEAL_TYPES: { [key in MealType]: string } = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "點心"
}

export const FOOD_CATEGORIES = [
  "碳水化合物",
  "蛋白質",
  "脂肪",
  "蔬菜",
  "水果",
  "其他"
] as const

export type FoodCategory = typeof FOOD_CATEGORIES[number]