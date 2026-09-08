import { getStatusBadgeClass, formatStatusForUser } from "@/lib/account";

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Badge({ status, label: customLabel, className = "", style }: BadgeProps) {
  const badgeClass = getStatusBadgeClass(status);
  const label = customLabel || formatStatusForUser(status);

  return (
    <span className={`account-badge ${badgeClass} ${className}`} style={style}>
      {label}
    </span>
  );
}
