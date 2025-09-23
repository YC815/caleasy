import type { User, Food, NutritionRecord, WeeklyStats, GlobalFood } from "@prisma/client"

export type { User, Food, NutritionRecord, WeeklyStats, GlobalFood }

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

// 統一的食物介面，消除用戶食物 vs 全域食物的特殊情況
export type UnifiedFood = {
  id: string
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  isGlobal: boolean // 標記是否為全域食物
}

// 食物搜尋結果
export type FoodSearchResult = {
  userFoods: UnifiedFood[]
  globalFoods: UnifiedFood[]
  isLoading: boolean
  error: string | null
}