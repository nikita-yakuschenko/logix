import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  IconCircleCheck,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleX,
  IconLoader2,
} from "@tabler/icons-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <IconCircleCheck className="size-4" stroke={1.75} />
        ),
        info: (
          <IconInfoCircle className="size-4" stroke={1.75} />
        ),
        warning: (
          <IconAlertTriangle className="size-4" stroke={1.75} />
        ),
        error: (
          <IconCircleX className="size-4" stroke={1.75} />
        ),
        loading: (
          <IconLoader2 className="size-4 animate-spin" stroke={1.75} />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
