import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { BarChart3, History, Calendar } from "lucide-react"

type ViewMode = "overview" | "history"
type TimeFrame = "daily" | "weekly"

interface DashboardShellProps {
  viewMode: ViewMode
  timeFrame: TimeFrame
  onViewModeChange: (mode: ViewMode) => void
  onTimeFrameChange: (frame: TimeFrame) => void
  children: React.ReactNode
  isLoading?: boolean
}

export function DashboardShell({
  viewMode,
  timeFrame,
  onViewModeChange,
  onTimeFrameChange,
  children,
  isLoading = false
}: DashboardShellProps) {
  return (
    <div className="max-w-md mx-auto">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "overview" ? "default" : "ghost"}
              size="sm"
              className="px-3"
              onClick={() => onViewModeChange("overview")}
              disabled={isLoading}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              總覽
            </Button>
            <Button
              variant={viewMode === "history" ? "default" : "ghost"}
              size="sm"
              className="px-3"
              onClick={() => onViewModeChange("history")}
              disabled={isLoading}
            >
              <History className="h-4 w-4 mr-1" />
              記錄歷史
            </Button>
          </div>

          {/* User Avatar */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 pb-20 space-y-6">
        {/* Time Frame Toggle - Only show in overview mode */}
        {viewMode === "overview" && (
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={timeFrame === "daily" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => onTimeFrameChange("daily")}
              disabled={isLoading}
            >
              <Calendar className="h-4 w-4 mr-1" />
              每日
            </Button>
            <Button
              variant={timeFrame === "weekly" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => onTimeFrameChange("weekly")}
              disabled={isLoading}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              每週
            </Button>
          </div>
        )}

        {/* Main Content */}
        {children}
      </div>
    </div>
  )
}