"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ensureUserExists } from "@/lib/user-utils"
import type { Food, GlobalFood } from "@prisma/client"

export async function createFood(data: {
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  userId: string
}): Promise<Food> {
  const food = await db.food.create({
    data
  })

  revalidatePath("/")
  return food
}

export async function getFoodsByUser(userId: string): Promise<Food[]> {
  return await db.food.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  })
}

export async function getFoodsByCategory(userId: string, category: string): Promise<Food[]> {
  return await db.food.findMany({
    where: {
      userId,
      category
    },
    orderBy: { name: "asc" }
  })
}

export async function deleteFood(foodId: string): Promise<void> {
  await db.food.delete({
    where: { id: foodId }
  })

  revalidatePath("/")
}

export async function updateFood(
  foodId: string,
  data: Partial<Omit<Food, "id" | "userId" | "createdAt">>
): Promise<Food> {
  const food = await db.food.update({
    where: { id: foodId },
    data
  })

  revalidatePath("/")
  return food
}

export async function getGlobalFoodsByCategory(category: string): Promise<GlobalFood[]> {
  return await db.globalFood.findMany({
    where: {
      category,
      isPublished: true
    },
    orderBy: { name: "asc" }
  })
}

export async function searchGlobalFoods(query: string): Promise<GlobalFood[]> {
  return await db.globalFood.findMany({
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
}

export async function createFoodFromGlobal(globalFoodId: string, userId: string): Promise<Food> {
  const globalFood = await db.globalFood.findUnique({
    where: { id: globalFoodId }
  })

  if (!globalFood) {
    throw new Error("Global food not found")
  }

  // Ensure user exists
  const user = await ensureUserExists(userId)

  const food = await db.food.create({
    data: {
      name: globalFood.name,
      category: globalFood.category || "其他",
      caloriesPer100g: globalFood.caloriesPer100g || 0,
      proteinPer100g: globalFood.proteinPer100g || 0,
      carbsPer100g: globalFood.carbsPer100g || 0,
      fatPer100g: globalFood.fatPer100g || 0,
      userId: user.id
    }
  })

  revalidatePath("/")
  return food
}