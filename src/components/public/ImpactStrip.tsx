"use client";
import { useEffect, useRef, useState } from "react";
import type { Impact } from "@/schemas";

const SPONSORSHIP_SHOWS = new Set(["Mahanati", "Bigg Boss Kannada", "Sa Re Ga Ma Pa"]);

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
  const campaignsRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [campaignsVisible, setCampaignsVisible] = useState(false);
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
  const collaborators = data.worked.filter((person) => !SPONSORSHIP_SHOWS.has(person.name));
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
            {/* Names and what we made together, and nothing else: opening a
                portrait of someone else's face was the only thing the click did,
                and those portraits were never ours to show. */}
            <ul className="impact__worked-grid">
              {collaborators.map((person) => (
                <li key={person.name}>
                  <span>{person.name}</span>
                  <small>{person.context}</small>
                </li>
              ))}
            </ul>
          </div>
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
