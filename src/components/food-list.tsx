import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import type { FoodRecordWithFood, MealType } from "@/lib/types"
import { MEAL_TYPES } from "@/lib/types"
import { deleteFoodRecord } from "@/actions/record-actions"

type FoodListProps = {
  records: FoodRecordWithFood[]
  onEdit?: (recordId: string) => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit"
  })
}

function calculateRecordNutrition(record: FoodRecordWithFood) {
  const factor = record.amount / 100
  return {
    calories: Math.round(record.food.caloriesPer100g * factor),
    protein: Math.round(record.food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(record.food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(record.food.fatPer100g * factor * 10) / 10
  }
}

export function FoodList({ records, onEdit }: FoodListProps) {
  if (!records.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">今日飲食記錄</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            尚無飲食記錄，點擊右下角按鈕開始記錄
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleDelete = async (recordId: string) => {
    await deleteFoodRecord(recordId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">今日飲食記錄</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => {
          const nutrition = calculateRecordNutrition(record)
          const mealLabel = MEAL_TYPES[record.mealType as MealType]

          return (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{record.food.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {record.food.category}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {record.amount}g • {nutrition.calories} 大卡 •{" "}
                  {formatTime(new Date(record.recordedAt))} • {mealLabel}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  蛋白質 {nutrition.protein}g • 碳水 {nutrition.carbs}g • 脂肪{" "}
                  {nutrition.fat}g
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(record.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}