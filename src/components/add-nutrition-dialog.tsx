"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@clerk/nextjs"
import { createDirectNutritionRecord } from "@/actions/record-actions"

type AddNutritionDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddNutritionDialog({ isOpen, onClose, onSuccess }: AddNutritionDialogProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsLoading(true)
    try {
      await createDirectNutritionRecord(user.id, {
        name: formData.name || undefined,
        category: "其他",
        calories: parseFloat(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fat: parseFloat(formData.fat) || 0
      })

      setFormData({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: ""
      })
      onClose()
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
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>其他</DialogTitle>
          <DialogDescription>
            直接輸入你攝取的營養素總量
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">食物名稱（可選）</Label>
            <Input
              id="name"
              placeholder="例如：早餐、午餐..."
              value={formData.name}
              onChange={handleInputChange("name")}
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbs">碳水化合物 (g)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={formData.carbs}
                onChange={handleInputChange("carbs")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">脂肪 (g)</Label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={formData.fat}
                onChange={handleInputChange("fat")}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "新增中..." : "新增記錄"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}