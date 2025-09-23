"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { FoodRecordWithFood } from "@/lib/types"
import { updateFoodRecord } from "@/actions/record-actions"

type EditFoodDialogProps = {
  record: FoodRecordWithFood | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function EditFoodDialog({ record, isOpen, onClose, onSuccess }: EditFoodDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState(record?.amount.toString() || "")

  const resetForm = () => {
    setAmount(record?.amount.toString() || "")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!record) return

    setIsSubmitting(true)
    try {
      await updateFoodRecord(record.id, {
        amount: parseInt(amount)
      })

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating food record:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateNutrition = () => {
    if (!record || !amount) return null

    const factor = parseInt(amount) / 100
    return {
      calories: Math.round(record.food.caloriesPer100g * factor),
      protein: Math.round(record.food.proteinPer100g * factor * 10) / 10,
      carbs: Math.round(record.food.carbsPer100g * factor * 10) / 10,
      fat: Math.round(record.food.fatPer100g * factor * 10) / 10
    }
  }

  const isFormValid = amount
  const nutrition = calculateNutrition()

  if (!record) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>編輯飲食記錄</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium">{record.food.name}</div>
            <div className="text-sm text-muted-foreground">
              {record.food.category}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              每100g: {record.food.caloriesPer100g} 大卡 •
              蛋白質 {record.food.proteinPer100g}g •
              碳水 {record.food.carbsPer100g}g •
              脂肪 {record.food.fatPer100g}g
            </div>
          </div>

          <div>
            <Label htmlFor="amount">攝取份量 (g)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="輸入攝取份量"
            />
          </div>

          {nutrition && amount && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="text-sm font-medium mb-1">營養計算結果</div>
              <div className="text-sm text-muted-foreground">
                熱量 {nutrition.calories} 大卡 •
                蛋白質 {nutrition.protein}g •
                碳水 {nutrition.carbs}g •
                脂肪 {nutrition.fat}g
              </div>
            </div>
          )}


          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "更新中..." : "更新記錄"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}