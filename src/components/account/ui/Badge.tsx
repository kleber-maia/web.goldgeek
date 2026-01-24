import { KitStatus, getStatusBadgeClass, formatStatusForUser } from "@/lib/account";

interface BadgeProps {
  status: KitStatus;
  className?: string;
  style?: React.CSSProperties;
}

export default function Badge({ status, className = "", style }: BadgeProps) {
  const badgeClass = getStatusBadgeClass(status);
  const label = formatStatusForUser(status);

  return (
    <span className={`account-badge ${badgeClass} ${className}`} style={style}>
      {label}
    </span>
  );
}
