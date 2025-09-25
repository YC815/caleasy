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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { FoodCategory } from "@/lib/types"
import { AddFoodDialog } from "./add-food-dialog"
import { useUser } from "@clerk/nextjs"
import { createDirectNutritionRecord } from "@/actions/record-actions"

type AddRecordDialogProps = {
  onSuccess?: () => void
}

const mainCategories: FoodCategory[] = ["蛋白質", "碳水化合物", "蔬果與纖維"]

const categoryEmojis: Record<FoodCategory, string> = {
  "蛋白質": "🥩",
  "蔬果與纖維": "🥬",
  "碳水化合物": "🍚",
  "其他": "➕"
}

export function AddRecordDialog({ onSuccess }: AddRecordDialogProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [showFoodDialog, setShowFoodDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: ""
  })

  const handleCategorySelect = (category: FoodCategory) => {
    setSelectedCategory(category)
    setOpen(false)
    setShowFoodDialog(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsLoading(true)
    try {
      await createDirectNutritionRecord(user.id, {
        name: formData.name || undefined,
        category: "其他",
        calories: parseFloat(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0
      })

      setFormData({ name: "", calories: "", protein: "" })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create nutrition record:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleFoodDialogClose = () => {
    setSelectedCategory(null)
    setShowFoodDialog(false)
  }

  const handleFoodDialogSuccess = () => {
    handleFoodDialogClose()
    onSuccess?.()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 h-12 px-6 rounded-full shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            新增紀錄
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增紀錄</DialogTitle>
            <DialogDescription>
              選擇食物分類或直接輸入營養資料
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 三大分類按鈕 - 橫向排列 */}
            <div className="flex gap-2 justify-between">
              {mainCategories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="flex-1 h-16 flex flex-col gap-1 hover:bg-primary/10"
                  onClick={() => handleCategorySelect(category)}
                >
                  <span className="text-lg">{categoryEmojis[category]}</span>
                  <span className="text-xs font-medium">{category}</span>
                </Button>
              ))}
            </div>

            {/* 分隔線 */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-muted-foreground/20"></div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>

            {/* 其他項目表單 */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">食物名稱（可選）</Label>
                <Input
                  id="name"
                  placeholder="例如：早餐、午餐..."
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  tabIndex={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">熱量 (大卡)</Label>
                  <Input
                    id="calories"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={formData.calories}
                    onChange={handleInputChange("calories")}
                    required
                    autoFocus
                    tabIndex={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protein">蛋白質 (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={formData.protein}
                    onChange={handleInputChange("protein")}
                    required
                    tabIndex={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "新增中..." : "提交"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* 食物選擇對話框 */}
      {showFoodDialog && selectedCategory && (
        <AddFoodDialog
          category={selectedCategory}
          isOpen={showFoodDialog}
          onClose={handleFoodDialogClose}
          onSuccess={handleFoodDialogSuccess}
        />
      )}
    </>
  )
}