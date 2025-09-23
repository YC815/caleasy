"use server"

import { db } from "@/lib/db"
import type { User } from "@/lib/types"

export async function ensureUserExists(userId: string): Promise<User> {
  if (!userId) {
    throw new Error("User ID is required")
  }

  let user = await db.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    // Create user if doesn't exist (for Clerk integration)
    user = await db.user.create({
      data: {
        id: userId,
        email: `${userId}@temp.com`, // Temporary email, should be updated by Clerk webhook
      }
    })

    console.log("Created new user:", userId)
  }

  return user
}