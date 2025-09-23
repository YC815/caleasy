import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2 } from "lucide-react"
import type { FoodRecordWithFood } from "@/lib/types"
import { deleteFoodRecord } from "@/actions/record-actions"
import { EditFoodDialog } from "./edit-food-dialog"

type FoodListProps = {
  records: FoodRecordWithFood[]
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

export function FoodList({ records }: FoodListProps) {
  const [editRecord, setEditRecord] = useState<FoodRecordWithFood | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<FoodRecordWithFood | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteRecord) return

    setIsDeleting(true)
    try {
      await deleteFoodRecord(deleteRecord.id)
      setDeleteRecord(null)
    } catch (error) {
      console.error("Error deleting food record:", error)
    } finally {
      setIsDeleting(false)
    }
  }

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


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">今日飲食記錄</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => {
          const nutrition = calculateRecordNutrition(record)

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
                  {formatTime(new Date(record.recordedAt))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  蛋白質 {nutrition.protein}g • 碳水 {nutrition.carbs}g • 脂肪{" "}
                  {nutrition.fat}g
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditRecord(record)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteRecord(record)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>

      <EditFoodDialog
        record={editRecord}
        isOpen={!!editRecord}
        onClose={() => setEditRecord(null)}
      />

      <Dialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除「{deleteRecord?.food.name}」的記錄嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteRecord(null)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "刪除中..." : "刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}