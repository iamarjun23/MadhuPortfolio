"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle, type ThemeName } from "@/components/public/ThemeToggle";
import { defaultSiteSettings } from "@/schemas/settings";
import type { Contact, Settings } from "@/schemas";

type NavProps = Readonly<{
  contact: Contact | null;
  settings: Settings;
  initialTheme: ThemeName;
  showThemeToggle: boolean;
}>;

export function Nav({ contact, settings, initialTheme, showThemeToggle }: NavProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const isDrawingRoom = pathname === "/room";
  const site = settings.site ?? defaultSiteSettings;
  const brand = site.brand ?? defaultSiteSettings.brand;
  const navigation = site.navigation ?? defaultSiteSettings.navigation;

  useEffect(() => {
    const updateScrolledState = () => {
      setIsScrolled(window.scrollY > 16);

      if (pathname !== "/") {
        setIsPastHero(false);
        return;
      }

      const hero = document.getElementById("hero");
      setIsPastHero((hero?.getBoundingClientRect().bottom ?? Infinity) <= 64);
    };

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolledState);
  }, [pathname]);

  const caption = isDrawingRoom
    ? navigation.drawingRoomCaption
    : (contact?.availabilityLabel ?? "open for briefs");

  return (
    <header
      className={`public-nav${isScrolled ? " is-scrolled" : ""}${isPastHero ? " is-past-hero" : ""}`}
    >
      <div className="wrap public-nav__inner">
        <div className="public-nav__left nav-stagger">
          {showThemeToggle ? <ThemeToggle initialTheme={initialTheme} /> : null}
          <Link className="brand" href="/" aria-label={brand.homeLabel}>
            <span className="brand__name">{brand.name}</span>
            <span className="brand__suffix">{brand.suffix}</span>
          </Link>
          <span className="brand__caption" aria-live="polite">
            <span className="brand__caption-dash">{navigation.captionPrefix}&nbsp;</span>
            <span
              className="brand__caption-type"
              style={{ ["--ch" as string]: `${caption.length}ch` }}
            >
              {caption}
            </span>
          </span>
        </div>

        <nav className="public-nav__right nav-stagger" aria-label="Primary navigation">
          {isDrawingRoom ? (
            <Link className="public-nav__link" href="/">
              <span className="link-underline">{navigation.portfolioLabel}</span>
            </Link>
          ) : (
            <>
              <Link className="public-nav__link" href="#work">
                <span className="link-underline">{navigation.workLabel}</span>
              </Link>
              <Link className="public-nav__link" href="/room">
                <span className="link-underline">{navigation.drawingRoomLabel}</span>
              </Link>
              <Link className="public-nav__link" href="/studio">
                <span className="link-underline">{navigation.studioLabel}</span>
              </Link>
            </>
          )}
          {!isDrawingRoom ? (
            <Link className="public-nav__cta" href="#contact">
              {navigation.contactLabel}
              <span className="public-nav__cta-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
