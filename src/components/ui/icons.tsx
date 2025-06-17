import { LucideIcon } from "lucide-react";

export function Icons({
  icon: Icon,
  className,
  ...props
}: {
  icon: LucideIcon;
  className?: string;
} & React.ComponentPropsWithoutRef<"svg">) {
  return <Icon className={`h-4 w-4 ${className}`} {...props} />;
}
