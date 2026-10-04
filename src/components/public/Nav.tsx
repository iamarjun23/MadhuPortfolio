"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavReel } from "@/components/public/NavReel";
import { defaultSiteSettings } from "@/schemas/settings";
import type { Contact, Settings } from "@/schemas";

type NavProps = Readonly<{
  contact: Contact | null;
  settings: Settings;
  resumeUrl?: string | null;
  /** Studio preview only: render the bar as it looks on this page instead of the current route. */
  previewPath?: "/room";
}>;

/* The link itself opens the PDF in a new tab; this saves a copy alongside it.
   `download` is ignored on a link to another origin and the PDF lives on the
   media domain, so the `?download=1` copy relies on the Cloudflare Transform
   Rule that answers it with `Content-Disposition: attachment` (DEPLOYMENT.md).
   Loaded in a hidden frame rather than a clicked link so that, without the
   rule, the PDF renders out of sight instead of replacing this page. */
function downloadResume(url: string) {
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.src = `${url}${url.includes("?") ? "&" : "?"}download=1`;
  // appendChild, not append: the Workers types redeclare Element.append for HTMLRewriter.
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 60_000);
}

/* Where the Drawing Room's "back to the portfolio" button reads and writes,
   so it can return a visitor to the spot they left rather than the top of the
   page. Kept as session storage, not React state, because the Drawing Room
   needs to read it and it must survive the navigation between the two pages. */
export const HOME_SCROLL_KEY = "portfolio:home-scroll";
export const RESTORE_HOME_SCROLL_KEY = "portfolio:restore-home-scroll";

function formatAvailability(value: string | undefined) {
  const label = value?.trim();
  return !label || label.toLowerCase() === "available" ? "Available for freelance" : label;
}

function formatAvailabilityTicker(value: string | undefined) {
  const expanded = formatAvailability(value);
  return expanded.endsWith("·") ? expanded : `${expanded} ·`;
}

export function Nav({ contact, settings, resumeUrl, previewPath }: NavProps) {
  const routePath = usePathname();
  const pathname = previewPath ?? routePath;
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasClearedHero, setHasClearedHero] = useState(false);
  // Only the landing page has a hero to clear, so derive it rather than
  // resetting the flag from an effect on every other route.
  const isPastHero = pathname === "/" && hasClearedHero;
  const isDrawingRoom = pathname === "/room";
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

  /* Caught here, in the capture phase, rather than on each "Drawing Room" link
     (Nav's own, Footer's, the teaser's two): a listener on the document sees
     every one of them without having to be wired into each, and catches the
     click before Next's own handler starts the transition and resets the
     scroll - a plain scroll-position effect was tried first and lost that
     race, saving the post-reset 0 instead of where the visitor actually was. */
  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (pathname !== "/") return;
      const link = (event.target as HTMLElement | null)?.closest?.('a[href="/room"]');
      if (link) sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY));
    };
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [pathname]);

  /* The counterpart: on the way in, the click above left the spot to return
     to, so landing back on "/" jumps straight to it instead of the top.
     next/navigation's router.back() was tried first and rejected - the App
     Router's own scroll handling fought it and the page landed at the bottom
     instead. */
  useEffect(() => {
    if (pathname !== "/") return;
    const target = sessionStorage.getItem(RESTORE_HOME_SCROLL_KEY);
    if (!target) return;
    sessionStorage.removeItem(RESTORE_HOME_SCROLL_KEY);
    window.scrollTo(0, Number(target));
  }, [pathname]);

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

  const showCaption = isDrawingRoom || contact?.availableForFreelance;
  const caption = isDrawingRoom
    ? navigation.drawingRoomCaption
    : formatAvailabilityTicker(contact?.footerStatus);

  return (
    <header
      className={`public-nav${isScrolled ? " is-scrolled" : ""}${isPastHero ? " is-past-hero" : ""}`}
    >
      <div className="wrap public-nav__inner">
        <div className="public-nav__left nav-stagger">
          <Link className="brand" href="/" aria-label={brand.homeLabel}>
            <span className="brand__name">{brand.name}</span>
            <span className="brand__suffix">{brand.suffix}</span>
          </Link>
        </div>

        {isPastHero ? (
          <NavReel
            availability={
              contact?.availableForFreelance
                ? formatAvailability(contact.footerStatus).replace(/\s*·$/, "")
                : null
            }
            contactLabel={navigation.contactLabel}
            ownerName={site.ownerName ?? defaultSiteSettings.ownerName}
          />
        ) : showCaption ? (
          <span className="brand__caption" aria-label={`${navigation.captionPrefix} ${caption}`}>
            <span className="brand__caption-track" aria-hidden="true">
              <span className="brand__caption-item">
                <span className="brand__caption-dash">{navigation.captionPrefix}&nbsp;</span>
                <span>{caption}</span>
              </span>
              <span className="brand__caption-item brand__caption-item--clone">
                <span className="brand__caption-dash">{navigation.captionPrefix}&nbsp;</span>
                <span>{caption}</span>
              </span>
            </span>
          </span>
        ) : null}

        <nav className="public-nav__right nav-stagger" aria-label="Primary navigation">
          <Link className="public-nav__link" href={isPortfolioHome ? "#work" : "/#work"}>
            <span className="link-underline">{navigation.workLabel}</span>
          </Link>
          <Link className="public-nav__link" href="/room">
            <span className="link-underline">{navigation.drawingRoomLabel}</span>
          </Link>
          {resumeUrl ? (
            <a
              className="public-nav__link"
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => downloadResume(resumeUrl)}
            >
              <span className="link-underline">{navigation.resumeLabel}</span>
            </a>
          ) : null}
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
