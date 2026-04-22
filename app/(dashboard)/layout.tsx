import { Sidebar07Shell } from "@/components/sidebar-07-shell"

export const dynamic = "force-dynamic"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Sidebar07Shell>{children}</Sidebar07Shell>
}
