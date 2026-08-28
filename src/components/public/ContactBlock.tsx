"use client";
import { initialTimecode, useTimecode } from "@/lib/use-timecode";
import type { Contact } from "@/schemas";
export function ContactBlock({ contact }: Readonly<{ contact: Contact }>) {
  const timecodeRef = useTimecode();
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
              <i aria-hidden="true">↗</i>
            </a>
            <a
              className="contact__callback"
              href={`mailto:${contact.email}?subject=${encodeURIComponent("Callback request")}`}
            >
              {contact.callbackCtaLabel} <span aria-hidden="true">↗</span>
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
              <span ref={timecodeRef}>{initialTimecode}</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
