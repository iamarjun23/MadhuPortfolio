"use client";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { SectionTimeline } from "@/components/public/SectionTimeline";
import { callbackHref, cityOf, profilePath, telHref, whatsAppHref } from "@/lib/contact-links";
import type { TimelinePosition } from "@/lib/section-timeline";
import type { Contact } from "@/schemas";

type Tab = "email" | "callback" | "message";

const TAB_LABELS: Record<Tab, string> = {
  email: "Email",
  callback: "Callback",
  message: "Message",
};

/** The time in `timeZone`, e.g. "3:40 pm". Null until mounted, since the page is cached. */
function useLocalTime(timeZone: string) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-IN", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [timeZone]);

  return time;
}

export function ContactBlock({
  contact,
  timeline,
}: Readonly<{ contact: Contact; timeline?: TimelinePosition }>) {
  const id = useId();
  const [active, setActive] = useState<Tab>("email");
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const time = useLocalTime(contact.timeZone);

  const whatsApp = whatsAppHref(contact.socials.whatsapp);
  const linkedIn = contact.socials.linkedin;
  const tabs: Tab[] =
    whatsApp || linkedIn ? ["email", "callback", "message"] : ["email", "callback"];
  // The Message tab can disappear under a selection, e.g. while editing in the Studio.
  const current = tabs.includes(active) ? active : "email";

  const select = (tab: Tab) => {
    setActive(tab);
    document.getElementById(`${id}-tab-${tab}`)?.focus();
  };

  // Arrow keys move between tabs, per the WAI-ARIA tabs pattern.
  const onTabKey = (event: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    select(tabs[(tabs.indexOf(current) + step + tabs.length) % tabs.length]!);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(contact.email).then(
      () => setCopy("copied"),
      () => setCopy("failed"),
    );
  };

  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <SectionTimeline label={contact.eyebrow} position={timeline} />
        <div className="contact__layout">
          <div className="contact__pitch">
            <h2>
              {contact.heading} <em>{contact.headingAccent}</em>
            </h2>
            <p>{contact.intro}</p>
          </div>

          <div className="contact__card">
            <div className="contact__tabs" role="tablist" aria-label="How to get in touch">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${tab}`}
                  aria-selected={current === tab}
                  aria-controls={`${id}-panel-${tab}`}
                  tabIndex={current === tab ? 0 : -1}
                  onClick={() => setActive(tab)}
                  onKeyDown={onTabKey}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            <div
              className="contact__pane"
              role="tabpanel"
              id={`${id}-panel-email`}
              aria-labelledby={`${id}-tab-email`}
              hidden={current !== "email"}
            >
              <h3>{contact.email}</h3>
              <p>{contact.emailNote}</p>
              <div className="contact__actions">
                <a
                  className="contact__btn contact__btn--primary"
                  href={`mailto:${contact.email}?subject=${encodeURIComponent("Project enquiry")}`}
                >
                  {contact.projectCtaLabel} <span aria-hidden="true">→</span>
                </a>
                <button className="contact__btn" type="button" onClick={copyEmail}>
                  {copy === "copied" ? "Copied" : copy === "failed" ? "Copy failed" : "Copy"}
                </button>
              </div>
            </div>

            <div
              className="contact__pane"
              role="tabpanel"
              id={`${id}-panel-callback`}
              aria-labelledby={`${id}-tab-callback`}
              hidden={current !== "callback"}
            >
              <h3>{contact.callbackHeading}</h3>
              <p>{contact.callbackNote}</p>
              <div className="contact__actions">
                <a
                  className="contact__btn contact__btn--primary"
                  href={callbackHref(contact.email)}
                >
                  {contact.callbackCtaLabel} <span aria-hidden="true">→</span>
                </a>
                {contact.phone ? (
                  <a className="contact__btn" href={telHref(contact.phone)}>
                    {contact.phone}
                  </a>
                ) : null}
              </div>
            </div>

            {tabs.includes("message") ? (
              <div
                className="contact__pane"
                role="tabpanel"
                id={`${id}-panel-message`}
                aria-labelledby={`${id}-tab-message`}
                hidden={current !== "message"}
              >
                {whatsApp ? (
                  <a className="contact__row" href={whatsApp} target="_blank" rel="noreferrer">
                    <b>WhatsApp</b>
                    <span>
                      {contact.socials.whatsapp} <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                ) : null}
                {linkedIn ? (
                  <a className="contact__row" href={linkedIn} target="_blank" rel="noreferrer">
                    <b>LinkedIn</b>
                    <span>
                      {profilePath(linkedIn)} <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                ) : null}
              </div>
            ) : null}

            {contact.availableForFreelance ? (
              <p className="contact__status">
                <span className="contact__status-dot" aria-hidden="true" />
                <b>{contact.footerStatus}</b>
                {time ? (
                  <span>
                    {time} in {cityOf(contact.location)}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          {/* Phone layout only (the tabbed card above is hidden there): every way to get
              in touch as its own row, so none sits behind a tab. */}
          <div className="contact__list">
            {contact.availableForFreelance ? (
              <p className="contact__list-status">
                <span className="contact__status-dot" aria-hidden="true" />
                <b>{contact.footerStatus}</b>
                {time ? (
                  <span>
                    {time} in {cityOf(contact.location)}
                  </span>
                ) : null}
              </p>
            ) : null}
            <ul>
              {whatsApp ? (
                <li>
                  <a href={whatsApp} target="_blank" rel="noreferrer">
                    <b>WhatsApp</b>
                    <span>{contact.socials.whatsapp}</span>
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href={`mailto:${contact.email}?subject=${encodeURIComponent("Project enquiry")}`}
                >
                  <b>Email</b>
                  <span>{contact.email}</span>
                </a>
                <button type="button" onClick={copyEmail}>
                  {copy === "copied" ? "Copied" : copy === "failed" ? "Copy failed" : "Copy"}
                </button>
              </li>
              <li>
                <a href={callbackHref(contact.email)}>
                  <b>{contact.callbackCtaLabel}</b>
                  <span>{contact.callbackNote}</span>
                </a>
              </li>
              {contact.phone ? (
                <li>
                  <a href={telHref(contact.phone)}>
                    <b>Call</b>
                    <span>{contact.phone}</span>
                  </a>
                </li>
              ) : null}
              {linkedIn ? (
                <li>
                  <a href={linkedIn} target="_blank" rel="noreferrer">
                    <b>LinkedIn</b>
                    <span>{profilePath(linkedIn)}</span>
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
