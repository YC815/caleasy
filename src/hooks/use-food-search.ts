"use client"

import { useState, useEffect, useCallback } from "react"
import { searchFoodsUnified, createFoodFromGlobal } from "@/actions/food-actions"
import { useErrorHandler } from "@/hooks/use-error-handler"
import type { UnifiedFood, FoodSearchResult } from "@/lib/types"

// 簡潔的食物搜尋 hook - 消除 AddFoodDialog 的複雜邏輯
export function useFoodSearch(userId: string | undefined, category: string) {
  const [searchQuery, setSearchQuery] = useState("")
  const [result, setResult] = useState<FoodSearchResult>({
    userFoods: [],
    globalFoods: [],
    isLoading: false,
    error: null
  })
  const { handleAsyncError } = useErrorHandler()

  // 搜尋函數 - 統一處理用戶和全域食物
  const searchFoods = useCallback(async (query: string) => {
    if (!userId) return

    setResult(prev => ({ ...prev, isLoading: true, error: null }))

    const searchResult = await handleAsyncError(
      () => searchFoodsUnified(userId, category, query),
      () => setResult(prev => ({ ...prev, isLoading: false, error: "搜尋失敗" }))
    )

    if (searchResult) {
      setResult(searchResult)
    }
  }, [userId, category, handleAsyncError])

  // 添加全域食物到用戶清單
  const addGlobalFood = useCallback(async (globalFood: UnifiedFood): Promise<UnifiedFood | null> => {
    if (!userId || !globalFood.isGlobal) return null

    const createdFood = await handleAsyncError(() => createFoodFromGlobal(globalFood.id, userId))

    if (!createdFood) return null

    // 重新搜尋以更新清單
    await searchFoods(searchQuery)

    return {
      id: createdFood.id,
      name: createdFood.name,
      category: createdFood.category,
      caloriesPer100g: createdFood.caloriesPer100g,
      proteinPer100g: createdFood.proteinPer100g,
      carbsPer100g: createdFood.carbsPer100g,
      fatPer100g: createdFood.fatPer100g,
      isGlobal: false
    }
  }, [userId, searchQuery, searchFoods, handleAsyncError])

  // 自動搜尋邏輯
  useEffect(() => {
    if (!userId) return

    searchFoods(searchQuery)
  }, [searchQuery, userId, searchFoods])

  return {
    searchQuery,
    setSearchQuery,
    result,
    addGlobalFood,
    refresh: () => searchFoods(searchQuery)
  }
}