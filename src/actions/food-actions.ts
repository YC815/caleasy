"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { Food } from "@prisma/client"
import type { FoodSearchResult } from "@/lib/types"

export async function createFood(data: {
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  brand?: string
  servingUnit?: string
  servingSize?: number
  isGlobal?: boolean
  createdBy?: string
}): Promise<Food> {
  console.log("[CREATE_FOOD] 開始創建食物:", {
    hasDb: !!db,
    hasFoodModel: !!db?.food,
    data,
    timestamp: new Date().toISOString()
  })

  try {
    const food = await db.food.create({
      data: {
        name: data.name,
        category: data.category,
        caloriesPer100g: data.caloriesPer100g,
        proteinPer100g: data.proteinPer100g,
        carbsPer100g: data.carbsPer100g,
        fatPer100g: data.fatPer100g,
        brand: data.brand,
        servingUnit: data.servingUnit,
        servingSize: data.servingSize,
        isGlobal: data.isGlobal ?? false,
        createdBy: data.createdBy
      }
    })

    console.log("[CREATE_FOOD] 食物創建成功:", {
      foodId: food.id,
      foodName: food.name,
      category: food.category,
      isGlobal: food.isGlobal,
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

export async function getFoodsByCategory(category: string, globalOnly = false): Promise<Food[]> {
  console.log("[GET_FOODS_BY_CATEGORY] 開始查詢分類食物:", {
    hasDb: !!db,
    hasFoodModel: !!db?.food,
    category,
    globalOnly,
    timestamp: new Date().toISOString()
  })

  try {
    const foods = await db.food.findMany({
      where: {
        category,
        isPublished: true,
        ...(globalOnly && { isGlobal: true })
      },
      orderBy: { name: "asc" }
    })

    console.log("[GET_FOODS_BY_CATEGORY] 查詢成功:", {
      category,
      globalOnly,
      foodsCount: foods.length,
      foodNames: foods.map(f => f.name),
      timestamp: new Date().toISOString()
    })

    return foods
  } catch (error) {
    console.error("[GET_FOODS_BY_CATEGORY] 查詢失敗:", {
      category,
      globalOnly,
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

export async function searchFoods(query: string, category?: string): Promise<Food[]> {
  console.log("[SEARCH_FOODS] 開始搜索食物:", {
    query,
    category,
    hasDb: !!db,
    hasFoodModel: !!db?.food,
    timestamp: new Date().toISOString()
  })

  try {
    const foods = await db.food.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive"
        },
        isPublished: true,
        ...(category && { category })
      },
      orderBy: { name: "asc" },
      take: 20
    })

    console.log("[SEARCH_FOODS] 搜索成功:", {
      query,
      category,
      resultsCount: foods.length,
      firstFewResults: foods.slice(0, 3).map(f => f.name),
      timestamp: new Date().toISOString()
    })

    return foods
  } catch (error) {
    console.error("[SEARCH_FOODS] 搜索失敗:", {
      query,
      category,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

// 統一的食物搜尋函數
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
    const foods = await db.food.findMany({
      where: {
        category,
        isPublished: true,
        ...(query && {
          name: {
            contains: query,
            mode: "insensitive" as const
          }
        })
      },
      orderBy: { name: "asc" },
      take: query ? 20 : undefined
    })

    const result: FoodSearchResult = {
      foods,
      isLoading: false,
      error: null
    }

    console.log("[SEARCH_FOODS_UNIFIED] 搜尋成功:", {
      foodsCount: result.foods.length,
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
      isLoading: false,
      error: error instanceof Error ? error.message : "搜尋失敗"
    }
  }
}