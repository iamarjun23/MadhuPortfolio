"use client";
import { useEffect, useState } from "react";
import type { Contact } from "@/schemas";
export function ContactBlock({ contact }: Readonly<{ contact: Contact }>) {
  const [timecode, setTimecode] = useState("00:00:00:00");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const timer = window.setInterval(() => {
      frame = (frame + 1) % 24;
      const seconds = Math.floor(performance.now() / 1000);
      setTimecode(
        `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}:${String(frame).padStart(2, "0")}`,
      );
    }, 1000 / 24);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <div className="contact__panel">
          <div className="contact__pitch">
            <span className="slate">{contact.eyebrow}</span>
            <h2>
              {contact.heading} <em>{contact.headingAccent}</em>
            </h2>
            <p>{contact.intro}</p>
            <a
              className="contact__email"
              href={`mailto:${contact.email}?subject=Project%20enquiry`}
            >
              <span>{contact.projectCtaLabel}</span>
              <b>{contact.email}</b>
              <i aria-hidden="true">&nearr;</i>
            </a>
          </div>
          <aside className="contact__details">
            <div>
              <small>{contact.bestForLabel}</small>
              <p>{contact.bestFor}</p>
            </div>
            {contact.availableForFreelance ? (
              <div className="contact__availability">
                <small>{contact.availabilityHeading}</small>
                <p>{contact.footerStatus}</p>
              </div>
            ) : null}
            <div>
              <small>{contact.locationLabel}</small>
              <p>{contact.location}</p>
            </div>
            <div className="contact__links">
              {contact.socials.linkedin ? (
                <a href={contact.socials.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              {contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : null}
              <span>{timecode}</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
