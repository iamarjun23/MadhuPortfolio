import Link from "next/link";
import { getStudioDashboardData } from "@/lib/studio";

const sections = [
  {
    href: "/studio/hero",
    number: "01",
    label: "Hero",
    detail: "Headline, buttons and film-frame labels",
    media: "1 background video",
  },
  {
    href: "/studio/about",
    number: "02",
    label: "About",
    detail: "Your story, current status and tools",
    media: "1 portrait photo + optional video",
  },
  {
    href: "/studio/impact",
    number: "03",
    label: "Impact",
    detail: "Numbers strip, collaborators and campaigns",
    media: "1 photo per collaborator",
  },
  {
    href: "/studio/work",
    number: "04",
    label: "Work",
    detail: "Project cards grouped into filter categories",
    media: "YouTube link per project · no uploads at all",
  },
  {
    href: "/studio/booth",
    number: "05",
    label: "Photobooth",
    detail: "On-set photo wall and lightbox captions",
    media: "1 photo per slot",
  },
  {
    href: "/studio/praise",
    number: "06",
    label: "Praise",
    detail: "Testimonials and who said them",
    media: "Optional photo per person",
  },
  {
    href: "/studio/experience",
    number: "07",
    label: "Experience",
    detail: "One scene per role, with dates and location",
    media: "Scene photo + company logo per role",
  },
  {
    href: "/studio/room",
    number: "08",
    label: "Drawing Room",
    detail: "Pinboard of polaroids, notes and quotes",
    media: "1 photo per polaroid card",
  },
  {
    href: "/studio/contact",
    number: "09",
    label: "Contact",
    detail: "Invitation, contact details and social links",
    media: "No uploads",
  },
  {
    href: "/studio/settings",
    number: "10",
    label: "Site & Navigation",
    detail: "Brand wordmark, menu, footer, SEO and theme",
    media: "1 social share photo",
  },
] as const;

function getRelativeTime(date: Date) {
  const minutes = Math.floor(Math.max(0, Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export default async function StudioPage() {
  const dashboard = await getStudioDashboardData();
  const readiness = [
    {
      href: "/studio/work",
      label: "Selected work",
      detail:
        dashboard.workItems > 0 ? `${dashboard.workItems} videos ready` : "Add your first video",
      ready: dashboard.workItems > 0,
    },
    {
      href: "/studio/booth",
      label: "Photobooth",
      detail:
        dashboard.photos > 0 ? `${dashboard.photos} photographs ready` : "Add on-set photographs",
      ready: dashboard.photos > 0,
    },
    {
      href: "/studio/praise",
      label: "Praise",
      detail:
        dashboard.testimonials > 0
          ? `${dashboard.testimonials} testimonials ready`
          : "Optional · add when quotes arrive",
      ready: dashboard.testimonials > 0,
    },
    {
      href: "/studio/settings",
      label: "Site & navigation",
      detail: "Review menu, footer, SEO, and domain",
      ready: true,
    },
  ] as const;

  return (
    <section className="studio-page studio-dashboard" aria-labelledby="studio-dashboard-title">
      <div className="studio-dashboard__intro">
        <div>
          <span className="slate">Today in the Studio</span>
          <h1 id="studio-dashboard-title">What needs attention?</h1>
          <p>
            Jump straight to unfinished content, review recent changes, or open any page section.
            Save drafts while you work and publish only when the full site is ready.
          </p>
        </div>
        <div className="studio-dashboard__actions">
          <Link className="studio-dashboard__site-link" href="/studio/work">
            Edit selected work <span aria-hidden="true">→</span>
          </Link>
          <Link className="studio-dashboard__view-link" href="/" target="_blank">
            View live site <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <dl className="studio-stats">
        <div>
          <dt>Site status</dt>
          <dd>{dashboard.hasUnpublishedChanges ? "Needs publish" : "Up to date"}</dd>
        </div>
        <div>
          <dt>Work pieces</dt>
          <dd>{dashboard.workItems}</dd>
        </div>
        <div>
          <dt>Photographs</dt>
          <dd>{dashboard.photos}</dd>
        </div>
        <div>
          <dt>Testimonials</dt>
          <dd>{dashboard.testimonials}</dd>
        </div>
      </dl>

      <section className="studio-dashboard-grid" aria-label="Studio priorities and activity">
        <div>
          <span className="slate">Content readiness</span>
          <h2>Finish the essentials.</h2>
          <div className="studio-readiness">
            {readiness.map((item) => (
              <Link href={item.href} key={item.href}>
                <i className={item.ready ? "is-ready" : undefined} aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <b aria-hidden="true">→</b>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <span className="slate">Recent activity</span>
          <h2>Latest saved drafts.</h2>
          {dashboard.activity.length > 0 ? (
            <ul className="studio-activity">
              {dashboard.activity.map((item) => (
                <li key={item.id}>
                  <span>{item.message}</span>
                  <time dateTime={item.createdAt.toISOString()}>
                    {getRelativeTime(item.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p>No draft activity yet. Open a section below to start editing.</p>
          )}
        </div>
      </section>

      <section className="studio-section-map" aria-labelledby="studio-section-map-title">
        <header>
          <div>
            <span className="slate">All editable content</span>
            <h2 id="studio-section-map-title">Open a page section.</h2>
          </div>
          <span>{sections.length} editable sections</span>
        </header>
        <div>
          {sections.map((section) => (
            <Link href={section.href} key={section.href}>
              <i>{section.number}</i>
              <span>
                <strong>{section.label}</strong>
                <small>{section.detail}</small>
                <small className="studio-section-map__media">{section.media}</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
