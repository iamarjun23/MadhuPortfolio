"use client";
import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { realImage } from "@/lib/placeholders";
import type { Impact } from "@/schemas";

const SPONSORSHIP_SHOWS = new Set(["Mahanati", "Bigg Boss Kannada", "Sa Re Ga Ma Pa"]);

/* The stand-in on a collaborator tile that has no photo yet: the first letter of
   the first two words, so the grid keeps one shape whether or not a picture has
   been uploaded. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function CountUp({ value }: Readonly<{ value: string }>) {
  const match = value.match(/^(\d[\d,.]*)(.*)$/);
  const numericValue = match?.[1] ?? "";
  const target = numericValue ? parseFloat(numericValue.replace(/,/g, "")) : 0;
  const suffix = match?.[2] ?? value;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const frame = requestAnimationFrame(() => setN(target));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  const decimals = numericValue.includes(".") ? 1 : 0;
  return (
    <>
      {n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}

export function ImpactStrip({ data }: Readonly<{ data: Impact }>) {
  const ref = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const campaignsRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [campaignsVisible, setCampaignsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    // Unlike `visible` above, this one keeps observing so the reveal
    // replays every time the campaigns list scrolls back into view.
    const observer = new IntersectionObserver(
      ([entry]) => setCampaignsVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 },
    );
    if (campaignsRef.current) observer.observe(campaignsRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (activeIndex === null) return;

    window.requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeIndex]);
  const collaborators = data.worked.filter((person) => !SPONSORSHIP_SHOWS.has(person.name));
  const activePerson = activeIndex !== null ? collaborators[activeIndex] : undefined;
  const activeImage = activePerson ? realImage(activePerson.image) : null;
  const campaigns = data.campaigns.length
    ? data.campaigns
    : data.worked
        .filter((person) => SPONSORSHIP_SHOWS.has(person.name))
        .map((person) => ({
          name: person.name,
          context: "Jar sponsorship performance film",
          href: null,
        }));

  return (
    <section className="impact" ref={ref}>
      <div className="wrap">
        <div className="impact__panel">
          <div className="impact__stats">
            {data.stats.map((stat) => (
              <div key={stat.label}>
                <strong>{visible ? <CountUp value={stat.value} /> : "0"}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="impact__worked">
            <div className="impact__worked-heading">
              <h2>
                <b aria-hidden="true">02</b>
                {data.heading}
              </h2>
              <span>
                {collaborators.length} {data.collaboratorsLabel}
              </span>
            </div>
            <div className="impact__worked-grid" ref={gridRef}>
              {collaborators.map((person, index) => {
                const isActive = index === activeIndex;
                const image = realImage(person.image);
                return (
                  <button
                    type="button"
                    key={person.name}
                    aria-expanded={isActive}
                    disabled={!image}
                    className={isActive ? "is-active" : undefined}
                    onClick={() => setActiveIndex(isActive ? null : index)}
                  >
                    <span className="impact__worked-thumb" aria-hidden={!image}>
                      {image ? (
                        // Plain <img>, not MediaImage: no width/height to force onto it, so
                        // it keeps whatever aspect ratio the uploaded photo actually has.
                        <img src={image.url} alt={image.alt} loading="lazy" />
                      ) : (
                        <em>{initials(person.name)}</em>
                      )}
                    </span>
                    <span className="impact__worked-copy">
                      <span>{person.name}</span>
                      <small>{person.context}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {activePerson && activeImage ? (
            <>
              <div
                className="impact__preview-scrim"
                aria-hidden="true"
                onClick={() => setActiveIndex(null)}
              />
              <div
                className="impact__preview"
                role="dialog"
                aria-modal="true"
                aria-label={`${activePerson.name} preview`}
              >
                <button
                  type="button"
                  className="impact__preview-close"
                  onClick={() => setActiveIndex(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <span className="impact__preview-photo">
                  <MediaImage
                    src={activeImage.url}
                    alt={activeImage.alt}
                    width={760}
                    height={760}
                    sizes="(max-width: 900px) 60vw, 380px"
                  />
                </span>
                <div className="impact__preview-copy">
                  <em>{data.detailLabel}</em>
                  <b>{activePerson.name}</b>
                  <span>{activePerson.context}</span>
                </div>
              </div>
            </>
          ) : null}
          {campaigns.length ? (
            <div
              className={`impact__campaigns${campaignsVisible ? " is-visible" : ""}`}
              ref={campaignsRef}
            >
              <div>
                <span className="slate">Campaign credit</span>
                <h3>{data.campaignsHeading}</h3>
                <p>{data.campaignsDescription}</p>
              </div>
              <ul>
                {campaigns.map((campaign, index) => {
                  const content = (
                    <>
                      <b>{campaign.name}</b>
                      <span>{campaign.context}</span>
                    </>
                  );

                  return (
                    <li
                      key={campaign.name}
                      className="impact__campaign-row"
                      style={{ transitionDelay: `${index * 90}ms` }}
                    >
                      {campaign.href ? (
                        <a href={campaign.href} target="_blank" rel="noopener noreferrer">
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
