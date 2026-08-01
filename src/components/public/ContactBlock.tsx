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
        <span className="slate">Let&apos;s talk</span>
        <h2>
          Whatever you&apos;re making, let&apos;s <em>make it felt.</em>
        </h2>
        <p>
          Podcast, campaign, event or documentary - if it needs to move people, I&apos;d love to cut
          it.
        </p>
        <div>
          <a
            className="button button--primary"
            href={`mailto:${contact.email}?subject=Project%20enquiry`}
          >
            Email me <span aria-hidden="true">&rarr;</span>
          </a>
          {contact.socials.linkedin ? (
            <a
              className="button button--ghost"
              href={contact.socials.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          ) : null}
        </div>
        <footer>
          {contact.availableForFreelance ? <span>{contact.footerStatus}</span> : null}
          <span>{contact.location}</span>
          <span>{timecode}</span>
        </footer>
      </div>
    </section>
  );
}
