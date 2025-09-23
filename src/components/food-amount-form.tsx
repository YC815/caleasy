"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Food } from "@/lib/types"

type FoodAmountFormProps = {
  selectedFood: Food
  onSubmit: (amount: number) => Promise<void>
  onBack: () => void
  isLoading: boolean
}

export function FoodAmountForm({ selectedFood, onSubmit, onBack, isLoading }: FoodAmountFormProps) {
  const [amount, setAmount] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    await onSubmit(parseInt(amount))
  }

  const calculatedCalories = amount ?
    Math.round((selectedFood.caloriesPer100g * parseInt(amount || "0")) / 100) : 0

  return (
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
            總熱量：{calculatedCalories} 大卡
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-auto">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
        >
          返回
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading || !amount}>
          {isLoading ? "記錄中..." : "記錄"}
        </Button>
      </div>
    </form>
  )
}