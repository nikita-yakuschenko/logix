"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconLayoutList, IconPlus } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export function NavMain() {
  const pathname = usePathname() ?? '/'
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
              "group/navitem peer/menu-button flex h-8 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] focus-visible:ring-2",
              "hover:bg-primary hover:text-primary-foreground",
              sectionActive &&
                "bg-primary font-medium text-primary-foreground",
            )}
          >
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <IconLayoutList className="size-4 shrink-0" stroke={1.75} />
              <span className="truncate">Расчёты</span>
            </Link>
            <Link
              href="/quotes/new"
              title="Новый расчёт"
              className={cn(
                "bg-primary text-primary-foreground grid size-5 shrink-0 place-items-center rounded-full p-0 leading-none shadow-sm outline-none",
                "group-hover/navitem:bg-primary-foreground group-hover/navitem:text-primary",
                sectionActive && "bg-primary-foreground text-primary",
                "transition-colors hover:brightness-95",
                "focus-visible:ring-primary focus-visible:ring-offset-sidebar focus-visible:ring-2 focus-visible:ring-offset-1",
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
