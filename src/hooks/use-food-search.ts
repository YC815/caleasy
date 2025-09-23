"use client"

import { useState, useEffect, useCallback } from "react"
import { searchFoodsUnified } from "@/actions/food-actions"
import { useErrorHandler } from "@/hooks/use-error-handler"
import type { Food, FoodSearchResult } from "@/lib/types"

// 簡潔的食物搜尋 hook - 統一食物系統
export function useFoodSearch(category: string) {
  const [searchQuery, setSearchQuery] = useState("")
  const [result, setResult] = useState<FoodSearchResult>({
    foods: [],
    isLoading: false,
    error: null
  })
  const { handleAsyncError } = useErrorHandler()

  // 搜尋函數 - 統一處理用戶和全域食物
  const searchFoods = useCallback(async (query: string) => {
    setResult(prev => ({ ...prev, isLoading: true, error: null }))

    const searchResult = await handleAsyncError(
      () => searchFoodsUnified(category, query),
      () => setResult(prev => ({ ...prev, isLoading: false, error: "搜尋失敗" }))
    )

    if (searchResult) {
      setResult(searchResult)
    }
  }, [category, handleAsyncError])

  // 選擇食物 - 不再需要轉換邏輯
  const selectFood = useCallback((food: Food) => {
    return food
  }, [])

  // 自動搜尋邏輯
  useEffect(() => {
    searchFoods(searchQuery)
  }, [searchQuery, searchFoods])

  return {
    searchQuery,
    setSearchQuery,
    result,
    selectFood,
    refresh: () => searchFoods(searchQuery)
  }
}