import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2 } from "lucide-react"
import type { NutritionRecordWithFood } from "@/lib/types"
import { deleteNutritionRecord } from "@/actions/record-actions"
import { EditNutritionDialog } from "./edit-nutrition-dialog"

type NutritionListProps = {
  records: NutritionRecordWithFood[]
  showGroupedByDate?: boolean
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit"
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  })
}

function groupRecordsByDate(records: NutritionRecordWithFood[]): { date: string; records: NutritionRecordWithFood[] }[] {
  const groups: { [key: string]: NutritionRecordWithFood[] } = {}

  records.forEach(record => {
    const dateKey = new Date(record.recordedAt).toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(record)
  })

  return Object.entries(groups)
    .map(([dateKey, records]) => ({
      date: formatDate(new Date(dateKey)),
      records: records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    }))
    .sort((a, b) => new Date(b.records[0].recordedAt).getTime() - new Date(a.records[0].recordedAt).getTime())
}

export function NutritionList({ records, showGroupedByDate = false }: NutritionListProps) {
  const [editRecord, setEditRecord] = useState<NutritionRecordWithFood | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<NutritionRecordWithFood | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteRecord) return

    setIsDeleting(true)
    try {
      await deleteNutritionRecord(deleteRecord.id)
      setDeleteRecord(null)
    } catch (error) {
      console.error("Error deleting nutrition record:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!records.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{showGroupedByDate ? "營養記錄歷史" : "今日營養記錄"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            尚無營養記錄，點擊右下角按鈕開始記錄
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showGroupedByDate) {
    const groupedRecords = groupRecordsByDate(records)

    return (
      <div className="space-y-4">
        {groupedRecords.map((group, groupIndex) => (
          <Card key={groupIndex}>
            <CardHeader>
              <CardTitle className="text-lg">{group.date}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {record.food ? record.food.name : (record.name || "營養記錄")}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {record.category}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.food && record.amount && `${record.amount}g • `}
                      {Math.round(record.calories)} 大卡 •{" "}
                      {formatTime(new Date(record.recordedAt))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      蛋白質 {Math.round(record.protein * 10) / 10}g •
                      碳水 {Math.round(record.carbs * 10) / 10}g •
                      脂肪 {Math.round(record.fat * 10) / 10}g
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
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">今日營養記錄</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">
                  {record.food ? record.food.name : (record.name || "營養記錄")}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {record.category}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {record.food && record.amount && `${record.amount}g • `}
                {Math.round(record.calories)} 大卡 •{" "}
                {formatTime(new Date(record.recordedAt))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                蛋白質 {Math.round(record.protein * 10) / 10}g •
                碳水 {Math.round(record.carbs * 10) / 10}g •
                脂肪 {Math.round(record.fat * 10) / 10}g
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
        ))}
      </CardContent>

      <EditNutritionDialog
        record={editRecord}
        isOpen={!!editRecord}
        onClose={() => setEditRecord(null)}
      />

      <Dialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除「{deleteRecord?.name || "此營養記錄"}」嗎？此操作無法復原。
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