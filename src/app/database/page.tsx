import type { Metadata } from "next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Database Debug",
  description: "Debug page for inspecting the current database connection and table accessibility.",
}

export const dynamic = "force-dynamic"

interface ParsedDatabaseUrl {
  raw: string
  protocol?: string
  host?: string
  port?: string
  database?: string
  username?: string
  searchParams?: Record<string, string>
  error?: string
}

interface TableCheckResult {
  name: string
  count?: number
  durationMs: number
  sample?: unknown[]
  error?: string
}

type ConnectionStatus =
  | {
      status: "ok"
      latency: number
      serverTime?: string
    }
  | {
      status: "error"
      latency: number
      error?: string
    }

function parseDatabaseUrl(url?: string): ParsedDatabaseUrl | null {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)

    return {
      raw: url,
      protocol: parsed.protocol.replace(":", ""),
      host: parsed.hostname,
      port: parsed.port || "(default)",
      database: parsed.pathname.replace(/^\//, ""),
      username: parsed.username,
      searchParams: Object.fromEntries(parsed.searchParams.entries()),
    }
  } catch (error) {
    return {
      raw: url,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, serializeValue(val)]),
    )
  }

  return value
}

async function getTableChecks(): Promise<TableCheckResult[]> {
  const checks: Array<{
    name: string
    run: () => Promise<{ count: number; sample: unknown[] }>
  }> = [
    {
      name: "User",
      run: async () => {
        const [count, sample] = await Promise.all([
          db.user.count(),
          db.user.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
          }),
        ])

        return { count, sample: sample as unknown[] }
      },
    },
    {
      name: "Food",
      run: async () => {
        const [count, sample] = await Promise.all([
          db.food.count(),
          db.food.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
          }),
        ])

        return { count, sample: sample as unknown[] }
      },
    },
    {
      name: "NutritionRecord",
      run: async () => {
        const [count, sample] = await Promise.all([
          db.nutritionRecord.count(),
          db.nutritionRecord.findMany({
            take: 5,
            orderBy: { recordedAt: "desc" },
          }),
        ])

        return { count, sample: sample as unknown[] }
      },
    },
    {
      name: "WeeklyStats",
      run: async () => {
        const [count, sample] = await Promise.all([
          db.weeklyStats.count(),
          db.weeklyStats.findMany({
            take: 5,
            orderBy: { weekStartDate: "desc" },
          }),
        ])

        return { count, sample: sample as unknown[] }
      },
    },
    {
      name: "GlobalFood",
      run: async () => {
        const [count, sample] = await Promise.all([
          db.globalFood.count(),
          db.globalFood.findMany({
            take: 5,
            orderBy: { updatedAt: "desc" },
          }),
        ])

        return { count, sample: sample as unknown[] }
      },
    },
  ]

  const results = await Promise.all(
    checks.map(async (check) => {
      const startedAt = Date.now()

      try {
        const { count, sample } = await check.run()

        const sanitizedSample = sample.map((record) => serializeValue(record))

        return {
          name: check.name,
          count,
          sample: sanitizedSample,
          durationMs: Date.now() - startedAt,
        }
      } catch (error) {
        return {
          name: check.name,
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }),
  )

  return results
}

async function testDatabaseConnection(): Promise<ConnectionStatus> {
  const startedAt = Date.now()

  try {
    const result = await db.$queryRaw<Array<{ now: Date }>>`SELECT NOW() AS now`
    const latency = Date.now() - startedAt

    return {
      status: "ok" as const,
      latency,
      serverTime: result[0]?.now ? result[0].now.toISOString() : undefined,
    }
  } catch (error) {
    return {
      status: "error" as const,
      latency: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default async function DatabaseDebugPage() {
  const databaseUrl = process.env.DATABASE_URL
  const parsedUrl = parseDatabaseUrl(databaseUrl ?? undefined)
  const [connectionStatus, tableChecks] = await Promise.all([testDatabaseConnection(), getTableChecks()])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Database Debug</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          檢查目前應用程式連線的資料庫與各主要資料表的讀取狀況。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>連線資訊</CardTitle>
          <CardDescription>目前載入的 DATABASE_URL 內容與解析後資訊。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Raw Connection String</p>
            <p className="font-mono text-sm break-all rounded-md bg-muted/60 p-3">
              {databaseUrl ?? "(未設定)"}
            </p>
          </div>

          {parsedUrl ? (
            parsedUrl.error ? (
              <p className="text-sm text-destructive">解析資料庫連線字串時發生錯誤：{parsedUrl.error}</p>
            ) : (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">NODE_ENV</dt>
                  <dd className="font-medium">{process.env.NODE_ENV ?? "(unknown)"}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Protocol</dt>
                  <dd className="font-medium">{parsedUrl.protocol}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Host</dt>
                  <dd className="font-medium">{parsedUrl.host}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Port</dt>
                  <dd className="font-medium">{parsedUrl.port}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Database</dt>
                  <dd className="font-medium">{parsedUrl.database || "(未指定)"}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">User</dt>
                  <dd className="font-medium">{parsedUrl.username || "(未指定)"}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Search Params</dt>
                  <dd className="font-mono text-xs">
                    {parsedUrl.searchParams && Object.keys(parsedUrl.searchParams).length > 0
                      ? JSON.stringify(parsedUrl.searchParams, null, 2)
                      : "{}"}
                  </dd>
                </div>
              </dl>
            )
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>連線測試</CardTitle>
          <CardDescription>透過 SELECT NOW() 測試資料庫連線是否正常。</CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus.status === "ok" ? (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">狀態</span>
                <span className="font-medium text-emerald-600">連線成功</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">延遲</span>
                <span className="font-medium">{connectionStatus.latency} ms</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">資料庫時間</span>
                <span className="font-mono text-xs">{connectionStatus.serverTime ?? "N/A"}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-destructive">無法成功連線至資料庫。</p>
              <p className="text-xs text-muted-foreground">耗時：{connectionStatus.latency} ms</p>
              {connectionStatus.error ? (
                <p className="text-xs font-mono text-destructive/80">{connectionStatus.error}</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>資料表整體狀態</CardTitle>
          <CardDescription>快速檢視各資料表是否能成功讀取資料。</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Table
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Count
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Duration (ms)
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableChecks.map((table) => (
                <tr key={table.name}>
                  <td className="px-3 py-2 font-medium">{table.name}</td>
                  <td className="px-3 py-2">{table.error ? "-" : table.count}</td>
                  <td className="px-3 py-2">{table.durationMs}</td>
                  <td className="px-3 py-2">
                    {table.error ? (
                      <span className="text-destructive">Error</span>
                    ) : (
                      <span className="text-emerald-600">OK</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-destructive">
                    {table.error ? table.error : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {tableChecks.map((table) => (
        <Card key={`${table.name}-details`}>
          <CardHeader>
            <CardTitle>{table.name}</CardTitle>
            <CardDescription>
              {table.error
                ? "讀取資料時發生錯誤"
                : `共 ${table.count ?? 0} 筆資料，以下為最新的 ${table.sample?.length ?? 0} 筆樣本。`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {table.error ? (
              <p className="text-sm text-destructive">{table.error}</p>
            ) : (
              <pre className="max-h-[400px] overflow-auto rounded-md bg-muted/60 p-4 text-xs">
                {JSON.stringify(table.sample ?? [], null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
