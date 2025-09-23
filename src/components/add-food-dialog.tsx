"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, ArrowLeft, Trash2 } from "lucide-react"
import { FOOD_CATEGORIES, type FoodCategory } from "@/lib/types"
import { getGlobalFoodsByCategory, createFoodFromGlobal } from "@/actions/food-actions"
import { createFoodRecord } from "@/actions/record-actions"
import { useUser } from "@clerk/nextjs"
import type { GlobalFood } from "@prisma/client"

type AddFoodDialogProps = {
  onSuccess?: () => void
}

type Step = "category" | "food" | "amount" | "list"

type PendingFood = {
  globalFood: GlobalFood
  amount: number
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export function AddFoodDialog({ onSuccess }: AddFoodDialogProps) {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<Step>("category")
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "">("")
  const [globalFoods, setGlobalFoods] = useState<GlobalFood[]>([])
  const [selectedGlobalFood, setSelectedGlobalFood] = useState<GlobalFood | null>(null)
  const [pendingFoods, setPendingFoods] = useState<PendingFood[]>([])
  const [currentAmount, setCurrentAmount] = useState("")

  const resetForm = () => {
    setStep("category")
    setSelectedCategory("")
    setGlobalFoods([])
    setSelectedGlobalFood(null)
    setPendingFoods([])
    setCurrentAmount("")
  }

  useEffect(() => {
    if (selectedCategory) {
      loadGlobalFoods(selectedCategory)
    }
  }, [selectedCategory])

  const loadGlobalFoods = async (category: FoodCategory) => {
    try {
      const foods = await getGlobalFoodsByCategory(category)
      setGlobalFoods(foods)
    } catch (error) {
      console.error("Error loading global foods:", error)
      setGlobalFoods([])
    }
  }

  const handleSubmit = async () => {
    if (!user?.id || pendingFoods.length === 0) {
      console.error("Missing user ID or no pending foods:", { userId: user?.id, pendingFoodsCount: pendingFoods.length })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Starting submission with user ID:", user.id)

      for (const pendingFood of pendingFoods) {
        console.log("Creating food from global:", pendingFood.globalFood.id)
        const food = await createFoodFromGlobal(pendingFood.globalFood.id, user.id)

        console.log("Creating food record for food:", food.id)
        await createFoodRecord({
          amount: pendingFood.amount,
          userId: user.id,
          foodId: food.id
        })
      }

      setIsOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error("Error adding foods:", error)
      // Show user-friendly error message
      alert(`添加食物失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCategorySelect = (category: FoodCategory) => {
    setSelectedCategory(category)
    setStep("food")
  }

  const handleFoodSelect = (food: GlobalFood) => {
    setSelectedGlobalFood(food)
    setCurrentAmount("")
    setStep("amount")
  }

  const handleAmountSubmit = () => {
    if (!selectedGlobalFood || !currentAmount) return

    const amount = parseInt(currentAmount)
    const factor = amount / 100
    const nutrition = {
      calories: Math.round((selectedGlobalFood.caloriesPer100g || 0) * factor),
      protein: Math.round((selectedGlobalFood.proteinPer100g || 0) * factor * 10) / 10,
      carbs: Math.round((selectedGlobalFood.carbsPer100g || 0) * factor * 10) / 10,
      fat: Math.round((selectedGlobalFood.fatPer100g || 0) * factor * 10) / 10
    }

    setPendingFoods(prev => [...prev, {
      globalFood: selectedGlobalFood,
      amount,
      nutrition
    }])

    setStep("list")
  }

  const removePendingFood = (index: number) => {
    setPendingFoods(prev => prev.filter((_, i) => i !== index))
  }

  const addMoreFood = () => {
    setSelectedCategory("")
    setGlobalFoods([])
    setSelectedGlobalFood(null)
    setCurrentAmount("")
    setStep("category")
  }

  const goBack = () => {
    if (step === "food") {
      setStep("category")
      setSelectedCategory("")
      setGlobalFoods([])
    } else if (step === "amount") {
      setStep("food")
      setSelectedGlobalFood(null)
      setCurrentAmount("")
    } else if (step === "list") {
      setStep("amount")
    }
  }

  const calculateCurrentNutrition = () => {
    if (!selectedGlobalFood || !currentAmount) return null

    const factor = parseInt(currentAmount) / 100
    return {
      calories: Math.round((selectedGlobalFood.caloriesPer100g || 0) * factor),
      protein: Math.round((selectedGlobalFood.proteinPer100g || 0) * factor * 10) / 10,
      carbs: Math.round((selectedGlobalFood.carbsPer100g || 0) * factor * 10) / 10,
      fat: Math.round((selectedGlobalFood.fatPer100g || 0) * factor * 10) / 10
    }
  }

  const getTotalNutrition = () => {
    return pendingFoods.reduce((total, food) => ({
      calories: total.calories + food.nutrition.calories,
      protein: total.protein + food.nutrition.protein,
      carbs: total.carbs + food.nutrition.carbs,
      fat: total.fat + food.nutrition.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const isAmountValid = selectedGlobalFood && currentAmount
  const currentNutrition = calculateCurrentNutrition()
  const totalNutrition = getTotalNutrition()

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
          <div className="flex items-center gap-2">
            {step !== "category" && (
              <Button variant="ghost" size="sm" onClick={goBack} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {step === "category" && "選擇食物分類"}
              {step === "food" && `選擇${selectedCategory}`}
              {step === "amount" && "輸入食用份量"}
              {step === "list" && "確認食物清單"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {step === "category" && (
            <div className="grid gap-3">
              {FOOD_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="h-12 text-base"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {step === "food" && (
            <div className="space-y-3">
              {globalFoods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  此分類暫無食物資料
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {globalFoods.map((food) => (
                    <Button
                      key={food.id}
                      variant="outline"
                      className="w-full h-auto p-3 text-left justify-start"
                      onClick={() => handleFoodSelect(food)}
                    >
                      <div>
                        <div className="font-medium">{food.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {food.caloriesPer100g} 大卡/100g
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "amount" && selectedGlobalFood && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">{selectedGlobalFood.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedGlobalFood.category}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  每100g: {selectedGlobalFood.caloriesPer100g} 大卡 •
                  蛋白質 {selectedGlobalFood.proteinPer100g}g •
                  碳水 {selectedGlobalFood.carbsPer100g}g •
                  脂肪 {selectedGlobalFood.fatPer100g}g
                </div>
              </div>

              <div>
                <Label htmlFor="amount">攝取份量 (g)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="輸入攝取份量"
                />
              </div>

              {currentNutrition && currentAmount && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-sm font-medium mb-1">營養計算結果</div>
                  <div className="text-sm text-muted-foreground">
                    熱量 {currentNutrition.calories} 大卡 •
                    蛋白質 {currentNutrition.protein}g •
                    碳水 {currentNutrition.carbs}g •
                    脂肪 {currentNutrition.fat}g
                  </div>
                </div>
              )}

              <Button
                onClick={handleAmountSubmit}
                className="w-full"
                disabled={!isAmountValid}
              >
                確認重量
              </Button>
            </div>
          )}

          {step === "list" && (
            <div className="space-y-4">
              <div className="space-y-3">
                {pendingFoods.map((pendingFood, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{pendingFood.globalFood.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pendingFood.amount}g • {pendingFood.nutrition.calories} 大卡
                      </div>
                      <div className="text-xs text-muted-foreground">
                        蛋白質 {pendingFood.nutrition.protein}g •
                        碳水 {pendingFood.nutrition.carbs}g •
                        脂肪 {pendingFood.nutrition.fat}g
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removePendingFood(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {pendingFoods.length > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-sm font-medium mb-1">總營養</div>
                  <div className="text-sm text-muted-foreground">
                    熱量 {totalNutrition.calories} 大卡 •
                    蛋白質 {totalNutrition.protein}g •
                    碳水 {totalNutrition.carbs}g •
                    脂肪 {totalNutrition.fat}g
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={addMoreFood}
                  className="flex-1"
                >
                  添加更多食物
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={pendingFoods.length === 0 || isSubmitting}
                >
                  {isSubmitting ? "送出中..." : "送出記錄"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}