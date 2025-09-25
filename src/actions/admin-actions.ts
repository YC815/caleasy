"use server"

import { recalculateAllWeeklyStats } from "./weekly-stats-actions"

export async function fixWeeklyStatsForUser(userId: string): Promise<{ success: boolean; message: string; data?: { recalculated: number; errors: number } }> {
  try {
    console.log(`[ADMIN] 開始修復用戶 ${userId} 的週統計數據`)

    const result = await recalculateAllWeeklyStats(userId)

    console.log(`[ADMIN] 週統計修復完成:`, result)

    return {
      success: true,
      message: `週統計修復完成：重新計算了 ${result.recalculated} 個週統計，發生 ${result.errors} 個錯誤`,
      data: result
    }
  } catch (error) {
    console.error(`[ADMIN] 週統計修復失敗:`, error)

    return {
      success: false,
      message: `週統計修復失敗：${error instanceof Error ? error.message : String(error)}`
    }
  }
}