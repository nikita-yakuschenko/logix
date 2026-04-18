"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  IconBadge,
  IconBell,
  IconChevronsDown,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react"
import { useNavigate } from 'react-router'

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const ini = initials(user.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback>{ini}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              {user.email ? (
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              ) : null}
            </div>
            <IconChevronsDown className="ml-auto size-4 shrink-0" stroke={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback>{ini}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    {user.email ? (
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    ) : null}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconBadge className="size-4" stroke={1.75} />
                Аккаунт
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconBell className="size-4" stroke={1.75} />
                Уведомления
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <IconSettings className="size-4" stroke={1.75} />
                Настройки
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <IconLogout className="size-4" stroke={1.75} />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
