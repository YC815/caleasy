// 統一時間處理 - 消除所有時間特殊情況
// Linus 式設計：一個類別解決所有時間問題

export interface DateBounds {
  start: Date
  end: Date
}

export class TimeManager {
  private static instance: TimeManager
  private _now: () => Date = () => new Date()

  static getInstance(): TimeManager {
    if (!this.instance) {
      this.instance = new TimeManager()
    }
    return this.instance
  }

  // 測試友善：允許注入時間函數
  setTimeFunction(nowFn: () => Date): void {
    this._now = nowFn
  }

  now(): Date {
    return this._now()
  }

  // 統一的本地日期邊界計算 - 消除時區混用
  getDayBounds(date: Date = this.now()): DateBounds {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  // 週的開始日期（週一）
  getWeekStartDate(date: Date = this.now()): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // 週的結束日期（週日）
  getWeekEndDate(weekStart: Date): Date {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
    return d
  }

  // 獲取週的完整邊界
  getWeekBounds(date: Date = this.now()): DateBounds {
    const start = this.getWeekStartDate(date)
    const end = this.getWeekEndDate(start)
    return { start, end }
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

  // 獲取日期的 ISO 字串（僅日期部分）
  getDateString(date: Date): string {
    return date.toISOString().split('T')[0]
  }
}

// 預設實例，方便使用
export const timeManager = TimeManager.getInstance()