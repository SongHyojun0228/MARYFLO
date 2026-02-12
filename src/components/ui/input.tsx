import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-gray-400 selection:bg-mint/30 selection:text-charcoal border-gray-200 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-mint focus-visible:ring-mint/25 focus-visible:ring-[1.5px]",
        "aria-invalid:border-red-400 aria-invalid:ring-red-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
