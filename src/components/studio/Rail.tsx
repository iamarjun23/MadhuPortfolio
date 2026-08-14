"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { studioNavGroups, type StudioBadgeCounts } from "@/lib/studio-nav";

type RailProps = Readonly<{
  badges: StudioBadgeCounts;
  open: boolean;
  onClose: () => void;
}>;

function isCurrentPath(pathname: string, href: string) {
  return href === "/studio" ? pathname === href : pathname.startsWith(`${href}/`);
}

export function Rail({ badges, open, onClose }: RailProps) {
  const pathname = usePathname();

  return (
    <aside className={`studio-rail ${open ? "is-open" : ""}`} aria-label="Studio navigation">
      <div className="studio-rail__brand">
        <Link className="studio-rail__home" href="/studio" onClick={onClose}>
          <span>madhu.edit</span>
          <small>Content studio</small>
        </Link>
        <button
          className="studio-icon-button studio-rail__close"
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <span aria-hidden="true">x</span>
        </button>
      </div>
      <nav>
        {studioNavGroups.map((group) => (
          <section className="studio-rail__group" key={group.label} aria-label={group.label}>
            <h2>
              <span>{group.label}</span>
              <b>{String(group.items.length).padStart(2, "0")}</b>
            </h2>
            <ul>
              {group.items.map((item, index) => {
                const current = isCurrentPath(pathname, item.href);
                const badge = item.badge ? badges[item.badge] : undefined;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      onClick={onClose}
                    >
                      <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                      <span>
                        <strong>{item.label}</strong>
                        {item.detail ? <small>{item.detail}</small> : null}
                      </span>
                      {badge !== undefined ? <em>{badge}</em> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  );
}
