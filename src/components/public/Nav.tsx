"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AvailabilityBadge } from "@/components/public/AvailabilityBadge";
import { ScrollScrubber } from "@/components/public/ScrollScrubber";
import { ThemeToggle, type ThemeName } from "@/components/public/ThemeToggle";
import type { Contact } from "@/schemas";

type NavProps = Readonly<{
  contact: Contact | null;
  initialTheme: ThemeName;
  showThemeToggle: boolean;
}>;

export function Nav({ contact, initialTheme, showThemeToggle }: NavProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const isDrawingRoom = pathname === "/room";

  useEffect(() => {
    const updateScrolledState = () => setIsScrolled(window.scrollY > 16);

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrolledState);
  }, []);

  return (
    <header className={`public-nav${isScrolled ? " is-scrolled" : ""}`}>
      <div className="wrap public-nav__inner">
        <div className="public-nav__left">
          <Link className="brand" href="/" aria-label="madhu.edit home">
            <span className="brand__dot" aria-hidden="true" />
            MADHU<span className="brand__sub">.edit</span>
          </Link>
          {isDrawingRoom ? <span className="room-tag">The Drawing Room</span> : null}
          {!isDrawingRoom && contact ? (
            <AvailabilityBadge
              available={contact.availableForFreelance}
              label={contact.availabilityLabel}
            />
          ) : null}
        </div>

        <nav className="public-nav__right" aria-label="Primary navigation">
          {isDrawingRoom ? (
            <Link className="public-nav__back-link" href="/">
              ← Portfolio
            </Link>
          ) : (
            <>
              <Link className="public-nav__link" href="#work">
                Work
              </Link>
              <Link className="public-nav__link" href="/room">
                Drawing Room
              </Link>
            </>
          )}
          {showThemeToggle ? <ThemeToggle initialTheme={initialTheme} /> : null}
          {!isDrawingRoom ? (
            <Link className="public-nav__hire-link" href="#contact">
              Hire me
            </Link>
          ) : null}
        </nav>
        <ScrollScrubber />
      </div>
    </header>
  );
}
