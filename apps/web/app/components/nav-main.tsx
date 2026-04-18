"use client"

import { Link, useLocation } from 'react-router'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconLayoutList, IconPlus } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export function NavMain() {
  const { pathname } = useLocation()
  const listActive = pathname === "/" || pathname === ""
  const newActive = pathname === "/quotes/new"
  const detailActive =
    /^\/quotes\/[^/]+$/.test(pathname) && pathname !== "/quotes/new"
  const sectionActive = listActive || newActive || detailActive

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Расчёты</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className={cn(
              "peer/menu-button flex h-8 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] focus-visible:ring-2",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              sectionActive &&
                "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <IconLayoutList className="size-4 shrink-0" stroke={1.75} />
              <span className="truncate">Расчёты</span>
            </Link>
            <Link
              to="/quotes/new"
              title="Новый расчёт"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full bg-neutral-950 p-0 leading-none text-white shadow-sm outline-none",
                "transition-colors hover:bg-neutral-800",
                "focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <IconPlus
                className="block size-3.5 shrink-0"
                stroke={2.25}
                aria-hidden
              />
              <span className="sr-only">Новый расчёт</span>
            </Link>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
