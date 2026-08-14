"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { PlaceholderImage } from "@/components/public/PlaceholderImage";
import { displayImageSrc, isPlaceholderImageSrc } from "@/lib/placeholders";
import type { Impact } from "@/schemas";

const TEMPORARY_IMPACT_IMAGES = [
  "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600",
] as const;

function getImpactImage(image: Impact["worked"][number]["image"], index: number, name: string) {
  if (image && !isPlaceholderImageSrc(displayImageSrc(image.url))) {
    return image;
  }

  return {
    url: TEMPORARY_IMPACT_IMAGES[index % TEMPORARY_IMPACT_IMAGES.length]!,
    alt: `Temporary preview portrait for ${name}`,
  };
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
  const [visible, setVisible] = useState(false);
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
                {data.worked.length} {data.collaboratorsLabel}
              </span>
            </div>
            {/* Grid auto-placement is DOM-order based: inserting the full-width
                detail panel right after the clicked card forces a new grid row,
                so it lands directly under that card's row at any column count. */}
            <div className="impact__worked-grid">
              {data.worked.map((person, index) => {
                const isActive = index === activeIndex;
                const image = getImpactImage(person.image, index, person.name);
                return (
                  <Fragment key={person.name}>
                    <button
                      type="button"
                      aria-expanded={isActive}
                      className={isActive ? "is-active" : undefined}
                      onClick={() => setActiveIndex(isActive ? null : index)}
                    >
                      {person.name}
                      <small>{person.context}</small>
                    </button>
                    {isActive ? (
                      <div className="impact__worked-detail">
                        <PlaceholderImage
                          src={image.url}
                          alt={image.alt}
                          width={480}
                          height={480}
                          sizes="(max-width: 560px) 36vw, (max-width: 900px) 30vw, 22vw"
                        />
                        <div className="impact__worked-detail-copy">
                          <em>{data.detailLabel}</em>
                          <b>{person.name}</b>
                          <span>{person.context}</span>
                        </div>
                        <button
                          type="button"
                          className="impact__worked-close"
                          aria-label="Close"
                          onClick={() => setActiveIndex(null)}
                        >
                          &times;
                        </button>
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
