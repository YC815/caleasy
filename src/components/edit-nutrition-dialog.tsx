"use client"

import { useState, useEffect } from "react"
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
import { updateNutritionRecord } from "@/actions/record-actions"
import type { NutritionRecordWithFood } from "@/lib/types"

type EditNutritionDialogProps = {
  record: NutritionRecordWithFood | null
  isOpen: boolean
  onClose: () => void
}

export function EditNutritionDialog({ record, isOpen, onClose }: EditNutritionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  })

  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name || "",
        calories: record.calories.toString(),
        protein: record.protein.toString(),
        carbs: record.carbs.toString(),
        fat: record.fat.toString()
      })
    }
  }, [record])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    setIsLoading(true)
    try {
      await updateNutritionRecord(record.id, {
        name: formData.name || undefined,
        calories: parseFloat(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fat: parseFloat(formData.fat) || 0
      })

      onClose()
    } catch (error) {
      console.error("Failed to update nutrition record:", error)
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
          <DialogTitle>編輯營養記錄</DialogTitle>
          <DialogDescription>
            修改此次營養攝取記錄
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">食物名稱（可選）</Label>
            <Input
              id="edit-name"
              placeholder="例如：早餐、午餐..."
              value={formData.name}
              onChange={handleInputChange("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-calories">熱量 (大卡)</Label>
              <Input
                id="edit-calories"
                type="number"
                step="0.1"
                min="0"
                value={formData.calories}
                onChange={handleInputChange("calories")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-protein">蛋白質 (g)</Label>
              <Input
                id="edit-protein"
                type="number"
                step="0.1"
                min="0"
                value={formData.protein}
                onChange={handleInputChange("protein")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-carbs">碳水化合物 (g)</Label>
              <Input
                id="edit-carbs"
                type="number"
                step="0.1"
                min="0"
                value={formData.carbs}
                onChange={handleInputChange("carbs")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fat">脂肪 (g)</Label>
              <Input
                id="edit-fat"
                type="number"
                step="0.1"
                min="0"
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
              {isLoading ? "更新中..." : "更新"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}