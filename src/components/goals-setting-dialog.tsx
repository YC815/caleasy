"use client"

import { useState, useEffect } from "react"
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
import { Settings } from "lucide-react"
import { updateUserGoals, getUserGoals } from "@/actions/user-actions"
import { useUser } from "@clerk/nextjs"

type GoalsSettingDialogProps = {
  onUpdate?: () => void
}

export function GoalsSettingDialog({ onUpdate }: GoalsSettingDialogProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [calorieGoal, setCalorieGoal] = useState("1750")
  const [proteinGoal, setProteinGoal] = useState("100")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadUserGoals = async () => {
      if (!user?.id) return

      try {
        const goals = await getUserGoals(user.id)
        setCalorieGoal(goals.dailyCalorieGoal.toString())
        setProteinGoal(goals.dailyProteinGoal.toString())
      } catch (error) {
        console.error("Failed to load user goals:", error)
      }
    }

    if (open && user?.id) {
      loadUserGoals()
    }
  }, [open, user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsLoading(true)
    try {
      const calorie = parseFloat(calorieGoal)
      const protein = parseFloat(proteinGoal)

      if (isNaN(calorie) || isNaN(protein) || calorie <= 0 || protein <= 0) {
        alert("請輸入有效的數值")
        return
      }

      await updateUserGoals(user.id, {
        dailyCalorieGoal: calorie,
        dailyProteinGoal: protein,
      })

      setOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error("Failed to update goals:", error)
      alert("更新目標失敗，請稍後再試")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>設定每日目標</DialogTitle>
          <DialogDescription>
            調整您的每日熱量和蛋白質目標
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="calorie" className="text-right">
              熱量目標
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="calorie"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                placeholder="1750"
                type="number"
                min="1"
                step="1"
              />
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="protein" className="text-right">
              蛋白質目標
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="protein"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                placeholder="100"
                type="number"
                min="1"
                step="0.1"
              />
              <span className="text-sm text-muted-foreground">g</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}