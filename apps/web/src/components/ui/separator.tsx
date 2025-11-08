import * as React from "react"

export function Separator({ className }: { className?: string }) {
  return (
    <div
      className={`w-full h-px bg-gray-200 my-4 ${className || ''}`}
      role="separator"
    />
  )
}

export default Separator
