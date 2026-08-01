type SectionPlaceholderProps = Readonly<{
  id: string;
  label: string;
  variant?: "default" | "hero" | "room";
}>;

export function SectionPlaceholder({ id, label, variant = "default" }: SectionPlaceholderProps) {
  return (
    <section
      id={id}
      className={`section-placeholder section-placeholder--${variant}`}
      aria-label={label}
    >
      <div className="wrap" />
    </section>
  );
}
