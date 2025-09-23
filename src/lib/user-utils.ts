"use server"

import { db } from "@/lib/db"
import type { User } from "@/lib/types"

export async function ensureUserExists(userId: string): Promise<User> {
  console.log("[ENSURE_USER_EXISTS] 開始確保用戶存在:", {
    userId,
    hasUserId: !!userId,
    userIdLength: userId?.length,
    hasDb: !!db,
    hasUserModel: !!db?.user,
    timestamp: new Date().toISOString()
  })

  if (!userId) {
    console.error("[ENSURE_USER_EXISTS] 缺少用戶ID:", {
      userId,
      timestamp: new Date().toISOString()
    })
    throw new Error("User ID is required")
  }

  try {
    console.log("[ENSURE_USER_EXISTS] 查找現有用戶:", { userId })
    let user = await db.user.findUnique({
      where: { id: userId }
    })

    console.log("[ENSURE_USER_EXISTS] 用戶查詢結果:", {
      userId,
      found: !!user,
      userEmail: user?.email,
      userCreatedAt: user?.createdAt?.toISOString(),
      timestamp: new Date().toISOString()
    })

    if (!user) {
      console.log("[ENSURE_USER_EXISTS] 用戶不存在，開始創建:", {
        userId,
        timestamp: new Date().toISOString()
      })

      const userData = {
        id: userId,
        email: `${userId}@temp.com`, // Temporary email, should be updated by Clerk webhook
      }

      console.log("[ENSURE_USER_EXISTS] 準備創建用戶資料:", {
        userData,
        timestamp: new Date().toISOString()
      })

      // Create user if doesn't exist (for Clerk integration)
      user = await db.user.create({
        data: userData
      })

      console.log("[ENSURE_USER_EXISTS] 用戶創庺成功:", {
        userId: user.id,
        userEmail: user.email,
        userCreatedAt: user.createdAt?.toISOString(),
        timestamp: new Date().toISOString()
      })
    } else {
      console.log("[ENSURE_USER_EXISTS] 用戶已存在:", {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      })
    }

    return user
  } catch (error) {
    console.error("[ENSURE_USER_EXISTS] 確保用戶存在失敗:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}