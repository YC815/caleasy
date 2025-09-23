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
import { createNutritionRecordFromFood } from "@/actions/record-actions"
import { useFoodSearch } from "@/hooks/use-food-search"
import { FoodSearchInput } from "@/components/food-search-input"
import { FoodList } from "@/components/food-list"
import { FoodAmountForm } from "@/components/food-amount-form"
import type { FoodCategory, Food } from "@/lib/types"

type AddFoodDialogProps = {
  category: FoodCategory
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddFoodDialog({ category, isOpen, onClose, onSuccess }: AddFoodDialogProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)

  // 使用統一的搜尋 hook - 簡化後的邏輯
  const { searchQuery, setSearchQuery, result, selectFood } = useFoodSearch(category)

  // 處理食物選擇 - 簡化邏輯（不再需要轉換）
  const handleFoodSelect = (food: Food) => {
    const selectedFood = selectFood(food)
    setSelectedFood(selectedFood)
  }

  // 提交記錄 - 簡化邏輯
  const handleSubmit = async (amount: number) => {
    if (!user?.id || !selectedFood) return

    setIsLoading(true)
    try {
      await createNutritionRecordFromFood(user.id, selectedFood.id, amount)

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

  // 統一顯示所有食物（不再區分全域/用戶）
  const displayFoods = result.foods

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
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <FoodSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <div className="flex-1 overflow-y-auto">
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