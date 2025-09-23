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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ArrowLeft, Plus } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { updateNutritionRecord } from "@/actions/record-actions"
import { getFoodsByCategory, searchGlobalFoods, createFoodFromGlobal } from "@/actions/food-actions"
import type { NutritionRecordWithFood, Food, FoodCategory } from "@/lib/types"
import type { GlobalFood } from "@prisma/client"

type EditNutritionDialogProps = {
  record: NutritionRecordWithFood | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function EditNutritionDialog({ record, isOpen, onClose, onSuccess }: EditNutritionDialogProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [editMode, setEditMode] = useState<"nutrition" | "food">("nutrition")
  const [step, setStep] = useState<"edit" | "select-category" | "select-food">("edit")

  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  })

  const [foodData, setFoodData] = useState({
    selectedFood: null as Food | null,
    selectedCategory: null as FoodCategory | null,
    amount: "",
    searchQuery: "",
    userFoods: [] as Food[],
    globalFoods: [] as GlobalFood[]
  })

  useEffect(() => {
    if (record) {
      const isDirectNutrition = !record.foodId
      setEditMode(isDirectNutrition ? "nutrition" : "food")
      setStep("edit")

      if (isDirectNutrition) {
        setFormData({
          name: record.name || "",
          calories: record.calories.toString(),
          protein: record.protein.toString(),
          carbs: record.carbs.toString(),
          fat: record.fat.toString()
        })
      } else {
        setFoodData(prev => ({
          ...prev,
          selectedFood: record.food,
          amount: record.amount?.toString() || "",
          searchQuery: "",
          userFoods: [],
          globalFoods: []
        }))
      }
    }
  }, [record])

  const loadUserFoods = async (category?: FoodCategory) => {
    if (!user?.id) return
    const targetCategory = category || foodData.selectedCategory
    if (!targetCategory) return
    try {
      const foods = await getFoodsByCategory(user.id, targetCategory)
      setFoodData(prev => ({ ...prev, userFoods: foods }))
    } catch (error) {
      console.error("Error loading foods:", error)
    }
  }

  const searchGlobalFoodsData = async () => {
    if (foodData.searchQuery.length < 2) {
      setFoodData(prev => ({ ...prev, globalFoods: [] }))
      return
    }
    try {
      const foods = await searchGlobalFoods(foodData.searchQuery)
      setFoodData(prev => ({ ...prev, globalFoods: foods }))
    } catch (error) {
      console.error("Error searching global foods:", error)
    }
  }

  useEffect(() => {
    if (editMode === "food" && step === "select-food" && user?.id && foodData.selectedCategory) {
      loadUserFoods()
    }
  }, [editMode, step, user?.id, foodData.selectedCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editMode === "food") {
      searchGlobalFoodsData()
    }
  }, [foodData.searchQuery, editMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNutritionSubmit = async (e: React.FormEvent) => {
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

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Failed to update nutrition record:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record || !foodData.selectedFood || !foodData.amount) return

    setIsLoading(true)
    try {
      const factor = parseFloat(foodData.amount) / 100
      const calories = foodData.selectedFood.caloriesPer100g * factor
      const protein = foodData.selectedFood.proteinPer100g * factor
      const carbs = foodData.selectedFood.carbsPer100g * factor
      const fat = foodData.selectedFood.fatPer100g * factor

      await updateNutritionRecord(record.id, {
        name: foodData.selectedFood.name,
        calories,
        protein,
        carbs,
        fat,
        amount: parseFloat(foodData.amount),
        foodId: foodData.selectedFood.id
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Failed to update nutrition record:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGlobalFoodSelect = async (globalFood: GlobalFood) => {
    if (!user?.id || !foodData.selectedCategory) return
    setIsLoading(true)
    try {
      const food = await createFoodFromGlobal(user.id, globalFood.id)
      setFoodData(prev => ({ ...prev, selectedFood: food }))
      setStep("edit")
    } catch (error) {
      console.error("Error creating food from global:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategorySelect = (category: FoodCategory) => {
    setFoodData(prev => ({
      ...prev,
      selectedCategory: category,
      searchQuery: "",
      userFoods: [],
      globalFoods: []
    }))
    setStep("select-food")
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleFoodDataChange = (field: keyof typeof foodData) => (
    value: string | Food | null | GlobalFood[] | FoodCategory | null
  ) => {
    setFoodData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (editMode === "nutrition") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯營養記錄</DialogTitle>
            <DialogDescription>
              修改此次營養攝取記錄
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNutritionSubmit} className="space-y-4">
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

  if (step === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯食物記錄</DialogTitle>
            <DialogDescription>
              {foodData.selectedFood ? `修改 ${foodData.selectedFood.name} 的攝取量` : "選擇要修改的食物"}
            </DialogDescription>
          </DialogHeader>

          {foodData.selectedFood ? (
            <form onSubmit={handleFoodSubmit} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">{foodData.selectedFood.name}</div>
                <div className="text-sm text-muted-foreground">
                  {foodData.selectedFood.caloriesPer100g} 大卡/100g
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">攝取量 (克)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={foodData.amount}
                  onChange={(e) => handleFoodDataChange("amount")(e.target.value)}
                  required
                />
              </div>

              {foodData.amount && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">營養資訊預覽：</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>熱量：{Math.round(foodData.selectedFood.caloriesPer100g * parseFloat(foodData.amount) / 100)} 大卡</div>
                    <div>蛋白質：{Math.round(foodData.selectedFood.proteinPer100g * parseFloat(foodData.amount) / 100 * 10) / 10}g</div>
                    <div>碳水：{Math.round(foodData.selectedFood.carbsPer100g * parseFloat(foodData.amount) / 100 * 10) / 10}g</div>
                    <div>脂肪：{Math.round(foodData.selectedFood.fatPer100g * parseFloat(foodData.amount) / 100 * 10) / 10}g</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("select-category")}
                >
                  重新選擇
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading || !foodData.amount}>
                  {isLoading ? "更新中..." : "更新"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">找不到原始食物資料</div>
              <Button onClick={() => setStep("select-category")}>重新選擇食物</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  if (step === "select-category") {
    const categoryEmojis: Record<FoodCategory, string> = {
      "蛋白質": "🥩",
      "蔬果與纖維": "🥬",
      "碳水化合物": "🍚",
      "其他": "➕"
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setStep("edit")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>選擇食物分類</DialogTitle>
                <DialogDescription>
                  請選擇要修改的食物分類
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {(["蛋白質", "蔬果與纖維", "碳水化合物"] as const).map((category) => (
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
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setStep("select-category")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle>選擇食物</DialogTitle>
              <DialogDescription>
                {foodData.selectedCategory && `在 ${foodData.selectedCategory} 分類中選擇食物`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          <div className="space-y-2">
            <Label htmlFor="search">搜尋食物</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="搜尋食物名稱..."
                value={foodData.searchQuery}
                onChange={(e) => handleFoodDataChange("searchQuery")(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3">
              {foodData.userFoods.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">我的食物</Label>
                  <div className="space-y-2 mt-2">
                    {foodData.userFoods.map((food) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setFoodData(prev => ({ ...prev, selectedFood: food }))
                          setStep("edit")
                        }}
                      >
                        <div>
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {food.caloriesPer100g} 大卡/100g
                          </div>
                        </div>
                        <Plus className="h-4 w-4" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {foodData.globalFoods.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">搜尋結果</Label>
                  <div className="space-y-2 mt-2">
                    {foodData.globalFoods.map((food) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleGlobalFoodSelect(food)}
                      >
                        <div>
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {food.brand && `${food.brand} • `}
                            {food.caloriesPer100g} 大卡/100g
                          </div>
                        </div>
                        <Plus className="h-4 w-4" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {foodData.searchQuery.length >= 2 && foodData.globalFoods.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  找不到符合的食物
                </div>
              )}

              {foodData.searchQuery.length < 2 && foodData.userFoods.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  請輸入至少 2 個字元來搜尋食物
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}