import { CalorieSummary } from "@/components/calorie-summary"
import { NutritionChart } from "@/components/nutrition-chart"
import { FoodList } from "@/components/food-list"
import { AddFoodDialog } from "@/components/add-food-dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, History, Calendar, User } from "lucide-react"
import { getFoodRecordsByDate } from "@/actions/record-actions"
import { calculateNutrition, calculateMacroRatios } from "@/lib/nutrition"

const DEFAULT_USER_ID = "user_1"

async function getDayData() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayRecords = await getFoodRecordsByDate(DEFAULT_USER_ID, today)
  const yesterdayRecords = await getFoodRecordsByDate(DEFAULT_USER_ID, yesterday)

  const todayNutrition = calculateNutrition(todayRecords)
  const yesterdayNutrition = calculateNutrition(yesterdayRecords)
  const macros = calculateMacroRatios(todayNutrition)

  return {
    todayRecords,
    todayNutrition,
    yesterdayCalories: yesterdayNutrition.calories,
    macros
  }
}

export default async function Home() {
  const { todayRecords, todayNutrition, yesterdayCalories, macros } = await getDayData()

  const weekAverage = 1750
  const targetCalories = 2000

  return (
    <div className="max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button variant="default" size="sm" className="px-3">
              <BarChart3 className="h-4 w-4 mr-1" />
              總覽
            </Button>
            <Button variant="ghost" size="sm" className="px-3">
              <History className="h-4 w-4 mr-1" />
              記錄歷史
            </Button>
          </div>

          <Avatar className="h-8 w-8">
            <AvatarImage src="/diverse-user-avatars.png" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-6">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button variant="default" size="sm" className="flex-1">
            <Calendar className="h-4 w-4 mr-1" />
            每日
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <BarChart3 className="h-4 w-4 mr-1" />
            每週
          </Button>
        </div>

        <CalorieSummary
          current={todayNutrition}
          previous={yesterdayCalories}
          average={weekAverage}
          target={targetCalories}
          timeFrame="daily"
        />

        <NutritionChart macros={macros} />

        <FoodList records={todayRecords} />
      </div>

      <AddFoodDialog />
    </div>
  )
}
