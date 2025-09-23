import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="h-64 space-y-3">
          <Skeleton className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export function PieChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-48 flex items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LineChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 mx-auto" />
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-1 w-4" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-1 w-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}