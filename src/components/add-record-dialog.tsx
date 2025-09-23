"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { FOOD_CATEGORIES } from "@/lib/types"
import type { FoodCategory } from "@/lib/types"
import { AddFoodDialog } from "./add-food-dialog"
import { AddNutritionDialog } from "./add-nutrition-dialog"

type AddRecordDialogProps = {
  onSuccess?: () => void
}

const categoryEmojis: Record<FoodCategory, string> = {
  "蛋白質": "🥩",
  "蔬果與纖維": "🥬",
  "碳水化合物": "🍚",
  "其他": "➕"
}

export function AddRecordDialog({ onSuccess }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null)
  const [showFoodDialog, setShowFoodDialog] = useState(false)
  const [showNutritionDialog, setShowNutritionDialog] = useState(false)

  const handleCategorySelect = (category: FoodCategory) => {
    setSelectedCategory(category)
    setOpen(false)

    if (category === "其他") {
      setShowNutritionDialog(true)
    } else {
      setShowFoodDialog(true)
    }
  }

  const handleSuccess = () => {
    setSelectedCategory(null)
    setShowFoodDialog(false)
    setShowNutritionDialog(false)
    onSuccess?.()
  }

  const handleClose = () => {
    setSelectedCategory(null)
    setShowFoodDialog(false)
    setShowNutritionDialog(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>選擇記錄類型</DialogTitle>
            <DialogDescription>
              請選擇要記錄的食物分類
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {FOOD_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-primary/10"
                onClick={() => handleCategorySelect(category)}
              >
                <span className="text-2xl">{categoryEmojis[category]}</span>
                <span className="text-sm font-medium">{category}</span>
                
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 傳統食物選擇對話框 */}
      {showFoodDialog && selectedCategory && selectedCategory !== "其他" && (
        <AddFoodDialog
          category={selectedCategory}
          isOpen={showFoodDialog}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

      {/* 快速營養記錄對話框 */}
      {showNutritionDialog && (
        <AddNutritionDialog
          isOpen={showNutritionDialog}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}