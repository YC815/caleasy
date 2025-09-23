"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { FOOD_CATEGORIES, MEAL_TYPES, type FoodCategory, type MealType } from "@/lib/types"
import { createFood } from "@/actions/food-actions"
import { createFoodRecord } from "@/actions/record-actions"
import { useUser } from "@clerk/nextjs"

type AddFoodDialogProps = {
  onSuccess?: () => void
}

export function AddFoodDialog({ onSuccess }: AddFoodDialogProps) {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "" as FoodCategory | "",
    caloriesPer100g: "",
    proteinPer100g: "",
    carbsPer100g: "",
    fatPer100g: "",
    amount: "",
    mealType: "" as MealType | ""
  })

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      caloriesPer100g: "",
      proteinPer100g: "",
      carbsPer100g: "",
      fatPer100g: "",
      amount: "",
      mealType: ""
    })
  }

  const handleSubmit = async () => {
    if (!user?.id) return

    setIsSubmitting(true)
    try {
      const food = await createFood({
        name: formData.name,
        category: formData.category,
        caloriesPer100g: parseInt(formData.caloriesPer100g),
        proteinPer100g: parseFloat(formData.proteinPer100g),
        carbsPer100g: parseFloat(formData.carbsPer100g),
        fatPer100g: parseFloat(formData.fatPer100g),
        userId: user.id
      })

      await createFoodRecord({
        amount: parseInt(formData.amount),
        mealType: formData.mealType as MealType,
        userId: user.id,
        foodId: food.id
      })

      setIsOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error("Error adding food:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name &&
    formData.category &&
    formData.caloriesPer100g &&
    formData.proteinPer100g &&
    formData.carbsPer100g &&
    formData.fatPer100g &&
    formData.amount &&
    formData.mealType

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>添加飲食記錄</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">食物名稱</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="輸入食物名稱"
            />
          </div>

          <div>
            <Label htmlFor="category">食物分類</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as FoodCategory })}>
              <SelectTrigger>
                <SelectValue placeholder="選擇分類" />
              </SelectTrigger>
              <SelectContent>
                {FOOD_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="calories">熱量 (大卡/100g)</Label>
              <Input
                id="calories"
                type="number"
                value={formData.caloriesPer100g}
                onChange={(e) => setFormData({ ...formData, caloriesPer100g: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="protein">蛋白質 (g/100g)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={formData.proteinPer100g}
                onChange={(e) => setFormData({ ...formData, proteinPer100g: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="carbs">碳水化合物 (g/100g)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                value={formData.carbsPer100g}
                onChange={(e) => setFormData({ ...formData, carbsPer100g: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="fat">脂肪 (g/100g)</Label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                value={formData.fatPer100g}
                onChange={(e) => setFormData({ ...formData, fatPer100g: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount">攝取份量 (g)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="輸入攝取份量"
            />
          </div>

          <div>
            <Label htmlFor="mealType">餐次</Label>
            <Select value={formData.mealType} onValueChange={(value) => setFormData({ ...formData, mealType: value as MealType })}>
              <SelectTrigger>
                <SelectValue placeholder="選擇餐次" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEAL_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "添加中..." : "添加記錄"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}