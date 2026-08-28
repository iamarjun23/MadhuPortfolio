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
  const [hasClearedHero, setHasClearedHero] = useState(false);
  // Only the landing page has a hero to clear, so derive it rather than
  // resetting the flag from an effect on every other route.
  const isPastHero = pathname === "/" && hasClearedHero;
  const isDrawingRoom = pathname === "/room";
  const isProcess = pathname === "/process";
  const isPortfolioHome = pathname === "/";
  const site = settings.site ?? defaultSiteSettings;
  const brand = site.brand ?? defaultSiteSettings.brand;
  const navigation = site.navigation ?? defaultSiteSettings.navigation;

  // Coalesced into one read per frame. Reacting to every scroll event meant a
  // forced layout per event, which is what made scrolling feel chunky.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setIsScrolled(window.scrollY > 16);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // The hero crossing is a geometry question, so let the browser answer it off
  // the main thread rather than measuring the hero on every scroll event.
  useEffect(() => {
    if (pathname !== "/") return;

    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHasClearedHero(!(entry?.isIntersecting ?? true)),
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  const caption = isDrawingRoom
    ? navigation.drawingRoomCaption
    : isProcess
      ? "How I work"
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
          <Link className="public-nav__link" href={isPortfolioHome ? "#work" : "/#work"}>
            <span className="link-underline">{navigation.workLabel}</span>
          </Link>
          <Link className="public-nav__link" href="/room">
            <span className="link-underline">{navigation.drawingRoomLabel}</span>
          </Link>
          <Link className="public-nav__link" href={navigation.studioHref}>
            <span className="link-underline">{navigation.studioLabel}</span>
          </Link>
          <Link className="public-nav__cta" href={isPortfolioHome ? "#contact" : "/#contact"}>
            {navigation.contactLabel}
            <span className="public-nav__cta-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
