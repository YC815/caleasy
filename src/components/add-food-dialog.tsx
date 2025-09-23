"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUser } from "@clerk/nextjs"
import { createFoodBasedRecord } from "@/actions/record-actions"
import { useFoodSearch } from "@/hooks/use-food-search"
import { FoodSearchInput } from "@/components/food-search-input"
import { FoodList } from "@/components/food-list"
import { FoodAmountForm } from "@/components/food-amount-form"
import type { FoodCategory, UnifiedFood } from "@/lib/types"

type AddFoodDialogProps = {
  category: FoodCategory
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddFoodDialog({ category, isOpen, onClose, onSuccess }: AddFoodDialogProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<UnifiedFood | null>(null)

  // 使用統一的搜尋 hook - 消除複雜邏輯
  const { searchQuery, setSearchQuery, result, addGlobalFood } = useFoodSearch(user?.id, category)

  // 處理食物選擇 - 統一邏輯
  const handleFoodSelect = async (food: UnifiedFood) => {
    if (food.isGlobal) {
      const userFood = await addGlobalFood(food)
      if (userFood) {
        setSelectedFood(userFood)
      }
    } else {
      setSelectedFood(food)
    }
  }

  // 提交記錄 - 簡化邏輯
  const handleSubmit = async (amount: number) => {
    if (!user?.id || !selectedFood) return

    setIsLoading(true)
    try {
      await createFoodBasedRecord(user.id, {
        foodId: selectedFood.id,
        amount
      })

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create food record:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 清理狀態
  const handleClose = () => {
    setSelectedFood(null)
    setSearchQuery("")
    onClose()
  }

  // 決定顯示的食物清單
  const displayFoods = searchQuery.length >= 2 ? result.globalFoods : result.userFoods

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{category} - 選擇食物</DialogTitle>
          <DialogDescription>
            選擇食物並輸入份量（克）
          </DialogDescription>
        </DialogHeader>

        {!selectedFood ? (
          <div className="flex-1 flex flex-col gap-4">
            <FoodSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <div className="flex-1 max-h-80 overflow-y-auto">
              {result.error && (
                <div className="text-center text-destructive py-4">
                  {result.error}
                </div>
              )}

              {result.isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  搜尋中...
                </div>
              ) : (
                <FoodList
                  foods={displayFoods}
                  searchQuery={searchQuery}
                  categoryName={category}
                  onFoodSelect={handleFoodSelect}
                />
              )}
            </div>
          </div>
        ) : (
          <FoodAmountForm
            selectedFood={selectedFood}
            onSubmit={handleSubmit}
            onBack={() => setSelectedFood(null)}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}