"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { Food, GlobalFood } from "@prisma/client"
import type { UnifiedFood, FoodSearchResult } from "@/lib/types"

// 統一食物轉換函數 - 消除特殊情況
function foodToUnified(food: Food): UnifiedFood {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    isGlobal: false
  }
}

function globalFoodToUnified(food: GlobalFood): UnifiedFood {
  return {
    id: food.id,
    name: food.name,
    category: food.category || "其他",
    caloriesPer100g: food.caloriesPer100g || 0,
    proteinPer100g: food.proteinPer100g || 0,
    carbsPer100g: food.carbsPer100g || 0,
    fatPer100g: food.fatPer100g || 0,
    isGlobal: true
  }
}

export async function createFood(data: {
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}): Promise<Food> {
  console.log("[CREATE_FOOD] 開始創建食物:", {
    hasDb: !!db,
    hasFoodModel: !!db?.food,
    data,
    timestamp: new Date().toISOString()
  })

  try {
    const food = await db.food.create({
      data
    })

    console.log("[CREATE_FOOD] 食物創建成功:", {
      foodId: food.id,
      foodName: food.name,
      category: food.category,
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
    return food
  } catch (error) {
    console.error("[CREATE_FOOD] 食物創建失敗:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      data,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function getFoodsByCategory(category: string): Promise<Food[]> {
  console.log("[GET_FOODS_BY_CATEGORY] 開始查詢分類食物:", {
    hasDb: !!db,
    hasFoodModel: !!db?.food,
    category,
    timestamp: new Date().toISOString()
  })

  try {
    const foods = await db.food.findMany({
      where: {
        category
      },
      orderBy: { name: "asc" }
    })

    console.log("[GET_FOODS_BY_CATEGORY] 查詢成功:", {
      category,
      foodsCount: foods.length,
      foodNames: foods.map(f => f.name),
      timestamp: new Date().toISOString()
    })

    return foods
  } catch (error) {
    console.error("[GET_FOODS_BY_CATEGORY] 查詢失敗:", {
      category,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function deleteFood(foodId: string): Promise<void> {
  console.log("[DELETE_FOOD] 開始刪除食物:", {
    foodId,
    hasDb: !!db,
    hasFoodModel: !!db?.food,
    timestamp: new Date().toISOString()
  })

  try {
    await db.food.delete({
      where: { id: foodId }
    })

    console.log("[DELETE_FOOD] 食物刪除成功:", {
      foodId,
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
  } catch (error) {
    console.error("[DELETE_FOOD] 食物刪除失敗:", {
      foodId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function updateFood(
  foodId: string,
  data: Partial<Omit<Food, "id" | "createdAt">>
): Promise<Food> {
  console.log("[UPDATE_FOOD] 開始更新食物:", {
    foodId,
    updateData: data,
    hasDb: !!db,
    hasFoodModel: !!db?.food,
    timestamp: new Date().toISOString()
  })

  try {
    const food = await db.food.update({
      where: { id: foodId },
      data
    })

    console.log("[UPDATE_FOOD] 食物更新成功:", {
      foodId: food.id,
      foodName: food.name,
      updatedFields: Object.keys(data),
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
    return food
  } catch (error) {
    console.error("[UPDATE_FOOD] 食物更新失敗:", {
      foodId,
      updateData: data,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function getGlobalFoodsByCategory(category: string): Promise<GlobalFood[]> {
  console.log("[GET_GLOBAL_FOODS_BY_CATEGORY] 開始查詢全域食物分類:", {
    category,
    hasDb: !!db,
    hasGlobalFoodModel: !!db?.globalFood,
    timestamp: new Date().toISOString()
  })

  try {
    const foods = await db.globalFood.findMany({
      where: {
        category,
        isPublished: true
      },
      orderBy: { name: "asc" }
    })

    console.log("[GET_GLOBAL_FOODS_BY_CATEGORY] 查詢成功:", {
      category,
      foodsCount: foods.length,
      foodNames: foods.map(f => f.name).slice(0, 5), // 只顯示前5個
      timestamp: new Date().toISOString()
    })

    return foods
  } catch (error) {
    console.error("[GET_GLOBAL_FOODS_BY_CATEGORY] 查詢失敗:", {
      category,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function searchGlobalFoods(query: string): Promise<GlobalFood[]> {
  console.log("[SEARCH_GLOBAL_FOODS] 開始搜索全域食物:", {
    query,
    hasDb: !!db,
    hasGlobalFoodModel: !!db?.globalFood,
    timestamp: new Date().toISOString()
  })

  try {
    const foods = await db.globalFood.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive"
        },
        isPublished: true
      },
      orderBy: { name: "asc" },
      take: 20
    })

    console.log("[SEARCH_GLOBAL_FOODS] 搜索成功:", {
      query,
      resultsCount: foods.length,
      firstFewResults: foods.slice(0, 3).map(f => f.name),
      timestamp: new Date().toISOString()
    })

    return foods
  } catch (error) {
    console.error("[SEARCH_GLOBAL_FOODS] 搜索失敗:", {
      query,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

export async function createFoodFromGlobal(globalFoodId: string): Promise<Food> {
  console.log("[CREATE_FOOD_FROM_GLOBAL] 開始從全域食物建立共享食物:", {
    globalFoodId,
    hasDb: !!db,
    hasGlobalFoodModel: !!db?.globalFood,
    hasFoodModel: !!db?.food,
    timestamp: new Date().toISOString()
  })

  try {
    const globalFood = await db.globalFood.findUnique({
      where: { id: globalFoodId }
    })

    console.log("[CREATE_FOOD_FROM_GLOBAL] 全域食物查詢結果:", {
      globalFoodId,
      found: !!globalFood,
      globalFoodName: globalFood?.name,
      timestamp: new Date().toISOString()
    })

    if (!globalFood) {
      throw new Error("Global food not found")
    }

    const category = globalFood.category || "其他"

    const existingFood = await db.food.findFirst({
      where: {
        name: globalFood.name,
        category
      }
    })

    if (existingFood) {
      console.log("[CREATE_FOOD_FROM_GLOBAL] 共享食物已存在，直接返回:", {
        foodId: existingFood.id,
        foodName: existingFood.name,
        category,
        timestamp: new Date().toISOString()
      })
      return existingFood
    }

    const foodData = {
      name: globalFood.name,
      category,
      caloriesPer100g: globalFood.caloriesPer100g || 0,
      proteinPer100g: globalFood.proteinPer100g || 0,
      carbsPer100g: globalFood.carbsPer100g || 0,
      fatPer100g: globalFood.fatPer100g || 0
    }

    console.log("[CREATE_FOOD_FROM_GLOBAL] 準備建立共享食物資料:", {
      foodData,
      timestamp: new Date().toISOString()
    })

    const food = await db.food.create({
      data: foodData
    })

    console.log("[CREATE_FOOD_FROM_GLOBAL] 共享食物建立成功:", {
      foodId: food.id,
      foodName: food.name,
      fromGlobalId: globalFoodId,
      category: food.category,
      timestamp: new Date().toISOString()
    })

    revalidatePath("/")
    return food
  } catch (error) {
    console.error("[CREATE_FOOD_FROM_GLOBAL] 從全域食物建立共享食物失敗:", {
      globalFoodId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// 統一的食物搜尋函數 - 消除分散的邏輯
export async function searchFoodsUnified(
  category: string,
  query?: string
): Promise<FoodSearchResult> {
  console.log("[SEARCH_FOODS_UNIFIED] 開始統一搜尋:", {
    category,
    query,
    timestamp: new Date().toISOString()
  })

  try {
    const [foods, globalFoods] = await Promise.all([
      db.food.findMany({
        where: {
          category,
          ...(query && {
            name: {
              contains: query,
              mode: "insensitive" as const
            }
          })
        },
        orderBy: { name: "asc" }
      }),
      query && query.length >= 2
        ? db.globalFood.findMany({
            where: {
              category,
              name: {
                contains: query,
                mode: "insensitive" as const
              },
              isPublished: true
            },
            orderBy: { name: "asc" },
            take: 20
          })
        : []
    ])

    const result: FoodSearchResult = {
      foods: foods.map(foodToUnified),
      globalFoods: (globalFoods || []).map(globalFoodToUnified),
      isLoading: false,
      error: null
    }

    console.log("[SEARCH_FOODS_UNIFIED] 搜尋成功:", {
      foodsCount: result.foods.length,
      globalFoodsCount: result.globalFoods.length,
      timestamp: new Date().toISOString()
    })

    return result
  } catch (error) {
    console.error("[SEARCH_FOODS_UNIFIED] 搜尋失敗:", {
      category,
      query,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    return {
      foods: [],
      globalFoods: [],
      isLoading: false,
      error: error instanceof Error ? error.message : "搜尋失敗"
    }
  }
}