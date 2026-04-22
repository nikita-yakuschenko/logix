"use client"

import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { SettingsProvider } from "@/settings/settings-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <SettingsProvider>
          {children}
          <Toaster />
        </SettingsProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
