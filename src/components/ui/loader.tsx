import * as React from "react"
import { Loader2 } from "lucide-react"

const Loader = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    {...props}
  >
    <Loader2 className="h-4 w-4 animate-spin" />
  </div>
))

Loader.displayName = "Loader"

export { Loader as Loader2 }
