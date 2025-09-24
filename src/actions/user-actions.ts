"use server"

import { db } from "@/lib/db"

export async function getUserGoals(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        dailyCalorieGoal: true,
        dailyProteinGoal: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return {
      dailyCalorieGoal: user.dailyCalorieGoal,
      dailyProteinGoal: user.dailyProteinGoal,
    }
  } catch (error) {
    console.error("Failed to get user goals:", error)
    throw error
  }
}

export async function updateUserGoals(userId: string, goals: {
  dailyCalorieGoal?: number
  dailyProteinGoal?: number
}) {
  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: goals,
      select: {
        dailyCalorieGoal: true,
        dailyProteinGoal: true,
      },
    })

    return updatedUser
  } catch (error) {
    console.error("Failed to update user goals:", error)
    throw error
  }
}