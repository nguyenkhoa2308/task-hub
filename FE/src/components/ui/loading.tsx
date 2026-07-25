import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const loadingVariants = cva("flex items-center justify-center", {
  variants: {
    variant: {
      fullscreen: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      inline: "py-4",
      overlay:
        "absolute inset-0 z-10 bg-background/60 backdrop-blur-xs rounded-lg",
    },
    size: {
      sm: "[--spinner-size:theme(spacing.4)] [--text-size:theme(fontSize.xs)]",
      default:
        "[--spinner-size:theme(spacing.6)] [--text-size:theme(fontSize.sm)]",
      lg: "[--spinner-size:theme(spacing.8)] [--text-size:theme(fontSize.base)]",
    },
  },
  defaultVariants: {
    variant: "fullscreen",
    size: "default",
  },
})

function Loading({
  className,
  variant = "fullscreen",
  size = "default",
  text,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof loadingVariants> & {
    text?: string
  }) {
  return (
    <div
      data-slot="loading"
      className={cn(loadingVariants({ variant, size, className }))}
      {...props}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="relative h-[var(--spinner-size)] w-[var(--spinner-size)]">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        </div>

        {/* Text */}
        {text && (
          <p className="text-[length:var(--text-size)] text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export { Loading, loadingVariants }
