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
// import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { createFoodBasedRecord } from "@/actions/record-actions"
import { getFoodsByCategory, searchGlobalFoods, createFoodFromGlobal } from "@/actions/food-actions"
import type { Food, FoodCategory } from "@/lib/types"
import type { GlobalFood } from "@prisma/client"

type AddFoodDialogProps = {
  category: FoodCategory
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddFoodDialog({ category, isOpen, onClose, onSuccess }: AddFoodDialogProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [amount, setAmount] = useState("")
  const [userFoods, setUserFoods] = useState<Food[]>([])
  const [globalFoods, setGlobalFoods] = useState<GlobalFood[]>([])

  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserFoods()
    }
  }, [isOpen, user?.id, category]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchGlobalFoodsData()
    } else {
      setGlobalFoods([])
    }
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserFoods = async () => {
    if (!user?.id) return
    try {
      const foods = await getFoodsByCategory(user.id, category)
      setUserFoods(foods)
    } catch (error) {
      console.error("Failed to load user foods:", error)
    }
  }

  const searchGlobalFoodsData = async () => {
    try {
      const foods = await searchGlobalFoods(searchQuery)
      setGlobalFoods(foods.filter(f => f.category === category))
    } catch (error) {
      console.error("Failed to search global foods:", error)
    }
  }

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food)
  }

  const handleGlobalFoodSelect = async (globalFood: GlobalFood) => {
    if (!user?.id) return
    try {
      const createdFood = await createFoodFromGlobal(globalFood.id, user.id)
      setSelectedFood(createdFood)
      loadUserFoods() // 重新載入使用者食物列表
    } catch (error) {
      console.error("Failed to add global food:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !selectedFood || !amount) return

    setIsLoading(true)
    try {
      await createFoodBasedRecord(user.id, {
        foodId: selectedFood.id,
        amount: parseInt(amount)
      })

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create food record:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFood(null)
    setAmount("")
    setSearchQuery("")
    setGlobalFoods([])
    onClose()
  }

  const displayFoods = searchQuery.length >= 2 ? globalFoods : userFoods

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
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋食物..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 max-h-80 overflow-y-auto">
              <div className="space-y-2">
                {displayFoods.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {searchQuery.length >= 2 ? "找不到相關食物" : `沒有 ${category} 類食物`}
                  </div>
                ) : (
                  displayFoods.map((food) => (
                    <Button
                      key={food.id}
                      variant="outline"
                      className="w-full justify-between h-auto p-3"
                      onClick={() => {
                        if ("userId" in food) {
                          handleFoodSelect(food as Food)
                        } else {
                          handleGlobalFoodSelect(food as GlobalFood)
                        }
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">{food.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {food.caloriesPer100g} 大卡/100g
                        </div>
                      </div>
                      {"userId" in food ? null : <Plus className="h-4 w-4" />}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="font-medium">{selectedFood.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedFood.caloriesPer100g} 大卡/100g
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">份量（克）</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
              />
            </div>

            {amount && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="text-sm">
                  總熱量：{Math.round((selectedFood.caloriesPer100g * parseInt(amount || "0")) / 100)} 大卡
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-auto">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedFood(null)}
              >
                返回
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !amount}>
                {isLoading ? "記錄中..." : "記錄"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}