// 統一時間處理 - 消除所有時間特殊情況
// Linus 式設計：一個類別解決所有時間問題
// 修復時區問題：統一使用 Asia/Taipei 計算日界線

import { DateTime } from "luxon"

export interface DateBounds {
  start: Date
  end: Date
}

// 台灣時區常數
const TAIWAN_TZ = "Asia/Taipei"

export class TimeManager {
  private static instance: TimeManager
  private _now: () => Date = () => new Date()

  static getInstance(): TimeManager {
    if (!this.instance) {
      this.instance = new TimeManager()
    }
    return this.instance
  }

  // 調試用：顯示當前時間邊界計算結果
  debugDayBounds(date: Date = this.now()): void {
    const bounds = this.getDayBounds(date)
    const inputDt = DateTime.fromJSDate(date).setZone(TAIWAN_TZ)
    const startDt = DateTime.fromJSDate(bounds.start).setZone(TAIWAN_TZ)
    const endDt = DateTime.fromJSDate(bounds.end).setZone(TAIWAN_TZ)

    console.log(`[TimeManager] 時區修復後的日期邊界調試`)
    console.log(`[TimeManager] 輸入時間 (台北): ${inputDt.toFormat('yyyy-MM-dd HH:mm:ss')}`)
    console.log(`[TimeManager] 查詢範圍 (台北): ${startDt.toFormat('yyyy-MM-dd HH:mm:ss')} 到 ${endDt.toFormat('yyyy-MM-dd HH:mm:ss')}`)
    console.log(`[TimeManager] UTC 查詢範圍: ${bounds.start.toISOString()} 到 ${bounds.end.toISOString()}`)
  }

  // 測試友善：允許注入時間函數
  setTimeFunction(nowFn: () => Date): void {
    this._now = nowFn
  }

  now(): Date {
    return this._now()
  }

  // 修復時區問題：統一使用台灣時區計算日界線
  // 確保無論在本地還是 Zeabur 都以台北時間為準
  getDayBounds(date: Date = this.now()): DateBounds {
    // 將輸入日期轉換到台灣時區，取得當天的開始和結束
    const dt = DateTime.fromJSDate(date).setZone(TAIWAN_TZ)
    const startOfDay = dt.startOf("day")
    const endOfDay = dt.endOf("day")

    // 轉回 UTC Date 物件供資料庫查詢使用
    return {
      start: startOfDay.toUTC().toJSDate(),
      end: endOfDay.toUTC().toJSDate()
    }
  }

  // 週的開始日期（週一）- 使用台灣時區計算
  getWeekStartDate(date: Date = this.now()): Date {
    const dt = DateTime.fromJSDate(date).setZone(TAIWAN_TZ)
    const startOfWeek = dt.startOf("week") // Luxon 的週一開始
    return startOfWeek.toJSDate()
  }

  // 週的結束日期（週日）- 使用台灣時區計算
  getWeekEndDate(weekStart: Date): Date {
    const dt = DateTime.fromJSDate(weekStart).setZone(TAIWAN_TZ)
    const endOfWeek = dt.endOf("week") // Luxon 的週日結束
    return endOfWeek.toJSDate()
  }

  // 獲取週的完整邊界 - 使用台灣時區計算
  getWeekBounds(date: Date = this.now()): DateBounds {
    const dt = DateTime.fromJSDate(date).setZone(TAIWAN_TZ)
    const startOfWeek = dt.startOf("week")
    const endOfWeek = dt.endOf("week")

    return {
      start: startOfWeek.toUTC().toJSDate(),
      end: endOfWeek.toUTC().toJSDate()
    }
  }

  // 統一的格式化輸出 - 消除重複的格式化邏輯
  formatDisplay(date: Date): string {
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    })
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString("zh-TW")
  }

  formatWeeklyRange(weekStart: Date): string {
    const weekEnd = this.getWeekEndDate(weekStart)

    const formatShortDate = (date: Date) => {
      return date.toLocaleDateString("zh-TW", {
        month: "short",
        day: "numeric"
      })
    }

    return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`
  }

  formatChartDate(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  formatWeekday(date: Date): string {
    return date.toLocaleDateString("zh-TW", { weekday: "short" })
  }

  // 獲取日期的 ISO 字串（僅日期部分）- 使用台灣時區
  getDateString(date: Date): string {
    const dt = DateTime.fromJSDate(date).setZone(TAIWAN_TZ)
    return dt.toFormat('yyyy-MM-dd')
  }
}

// 預設實例，方便使用
export const timeManager = TimeManager.getInstance()