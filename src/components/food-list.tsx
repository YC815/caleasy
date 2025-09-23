"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { UnifiedFood } from "@/lib/types"

type FoodListProps = {
  foods: UnifiedFood[]
  searchQuery: string
  categoryName: string
  onFoodSelect: (food: UnifiedFood) => void
}

export function FoodList({ foods, searchQuery, categoryName, onFoodSelect }: FoodListProps) {
  if (foods.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {searchQuery.length >= 2 ? "找不到相關食物" : `沒有 ${categoryName} 類食物`}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {foods.map((food) => (
        <Button
          key={food.id}
          variant="outline"
          className="w-full justify-between h-auto p-3"
          onClick={() => onFoodSelect(food)}
        >
          <div className="text-left">
            <div className="font-medium">{food.name}</div>
            <div className="text-sm text-muted-foreground">
              {food.caloriesPer100g} 大卡/100g
            </div>
          </div>
          {food.isGlobal && <Plus className="h-4 w-4" />}
        </Button>
      ))}
    </div>
  )
}