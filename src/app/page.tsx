import { DashboardView } from "@/components/dashboard-view"
import { auth } from "@clerk/nextjs/server"


export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('User not authenticated')
  }

  return <DashboardView userId={userId} />
}
