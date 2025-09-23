import type { NutritionRecord, NutritionRecordWithFood, NutritionSummary, MacroRatio } from "./types"

export function calculateNutrition(records: NutritionRecord[] | NutritionRecordWithFood[]): NutritionSummary {
  console.log("[CALCULATE_NUTRITION] 開始計算營養總和:", {
    recordsCount: records.length,
    recordsPreview: records.slice(0, 3).map(r => ({
      id: r.id,
      name: r.name,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat
    })),
    timestamp: new Date().toISOString()
  })

  const result = records.reduce(
    (total, record) => ({
      calories: total.calories + record.calories,
      protein: total.protein + record.protein,
      carbs: total.carbs + record.carbs,
      fat: total.fat + record.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  console.log("[CALCULATE_NUTRITION] 營養總和計算完成:", {
    recordsCount: records.length,
    result,
    timestamp: new Date().toISOString()
  })

  return result
}

export function calculateMacroRatios(nutrition: NutritionSummary): MacroRatio[] {
  const carbCalories = nutrition.carbs * 4
  const proteinCalories = nutrition.protein * 4
  const fatCalories = nutrition.fat * 9
  const totalMacroCalories = carbCalories + proteinCalories + fatCalories

  // 處理空資料情況
  if (totalMacroCalories === 0) {
    return [
      {
        name: "碳水化合物",
        value: 0,
        calories: 0,
        color: "#3b82f6"
      },
      {
        name: "蛋白質",
        value: 0,
        calories: 0,
        color: "#1e40af"
      },
      {
        name: "脂肪",
        value: 0,
        calories: 0,
        color: "#60a5fa"
      }
    ]
  }

  const carbPercent = (carbCalories / totalMacroCalories) * 100
  const proteinPercent = (proteinCalories / totalMacroCalories) * 100
  const fatPercent = (fatCalories / totalMacroCalories) * 100

  // 使用最大餘數法確保總和為100%
  const percentages = [carbPercent, proteinPercent, fatPercent]
  const roundedPercentages = percentages.map(p => Math.floor(p))
  const remainders = percentages.map((p, i) => ({ index: i, remainder: p - roundedPercentages[i] }))

  // 按餘數大小排序，將剩餘百分比分配給餘數最大的項目
  remainders.sort((a, b) => b.remainder - a.remainder)
  const totalRounded = roundedPercentages.reduce((sum, p) => sum + p, 0)
  const remainingPercent = 100 - totalRounded

  // 安全地分配剩餘百分比
  for (let i = 0; i < remainingPercent && i < remainders.length; i++) {
    roundedPercentages[remainders[i].index]++
  }

  return [
    {
      name: "碳水化合物",
      value: roundedPercentages[0],
      calories: Math.round(carbCalories),
      color: "#3b82f6"
    },
    {
      name: "蛋白質",
      value: roundedPercentages[1],
      calories: Math.round(proteinCalories),
      color: "#1e40af"
    },
    {
      name: "脂肪",
      value: roundedPercentages[2],
      calories: Math.round(fatCalories),
      color: "#60a5fa"
    }
  ]
}

export function calculateCalorieDifference(current: number, previous: number): {
  difference: number
  isIncrease: boolean
  percentage: number
} {
  const difference = current - previous
  const isIncrease = difference > 0
  const percentage = previous > 0 ? Math.round((Math.abs(difference) / previous) * 100) : 0

  return { difference, isIncrease, percentage }
}

export function isWithinCalorieGoal(current: number, target: number, tolerance = 0.1): boolean {
  const variance = Math.abs(current - target) / target
  return variance <= tolerance
}