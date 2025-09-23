import type { User, Food, NutritionRecord, WeeklyStats } from "@prisma/client"

export type { User, Food, NutritionRecord, WeeklyStats }

export type FoodWithRecords = Food & {
  records: NutritionRecord[]
}

export type NutritionRecordWithFood = NutritionRecord & {
  food: Food | null
}

// Record creation types - 統一輸入格式
export type NutritionInput = {
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sourceType: "food" | "manual"
  foodId?: string
  amount?: number
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

// 食物搜尋結果 - 簡化版本，不再需要區分用戶/全域食物
export type FoodSearchResult = {
  foods: Food[]
  isLoading: boolean
  error: string | null
}