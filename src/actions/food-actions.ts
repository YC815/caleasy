"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { Food } from "@/lib/types"

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