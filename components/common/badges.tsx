import { Badge } from "@/components/ui/staking-badge"
import { cn } from "@/lib/utils"

function Badges({
  badges = [],
  size = "default",
  badgeClassName,
  className,
}: {
  badges?: string[]
  size?: "default" | "sm"
  badgeClassName?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map(badge => (
        <Badge key={badge} size={size} className={badgeClassName}>
          {badge}
        </Badge>
      ))}
    </div>
  )
}

export default Badges
