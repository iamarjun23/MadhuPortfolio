import Link from "next/link";

type AvailabilityBadgeProps = Readonly<{
  available: boolean;
  label: string;
}>;

export function AvailabilityBadge({ available, label }: AvailabilityBadgeProps) {
  if (!available) {
    return null;
  }

  return (
    <Link className="availability-badge" href="#contact" aria-label={`${label} for projects`}>
      <span className="availability-badge__blip" aria-hidden="true" />
      <span className="availability-badge__label">{label}</span>
    </Link>
  );
}
