"use client"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Статичный бренд в шапке сайдбара, без выпадающего меню.
export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tabIndex={-1}
          type="button"
          className="pointer-events-none cursor-default hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent"
        >
          <img
            src="/logo_dark.svg"
            alt="logix"
            className="h-8 w-auto shrink-0"
            draggable={false}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
