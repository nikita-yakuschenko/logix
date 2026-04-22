"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { DEFAULT_DISPLAY_NAME } from "@/settings/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: DEFAULT_DISPLAY_NAME,
    email: "",
    avatar: "",
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh" {...props}>
      <SidebarHeader className="h-16 justify-center border-b py-0">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
