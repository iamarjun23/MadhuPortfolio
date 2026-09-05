import Link from "next/link";
import { getStudioDashboardData } from "@/lib/studio";

const sections = [
  {
    href: "/studio/hero",
    number: "01",
    label: "Hero",
    detail: "First impression, message & calls to action",
  },
  {
    href: "/studio/about",
    number: "02",
    label: "About",
    detail: "Portrait, story, status & tools",
  },
  { href: "/studio/impact", number: "03", label: "Impact", detail: "Metrics and collaborators" },
  {
    href: "/studio/work",
    number: "04",
    label: "Work",
    detail: "Video projects and category filters",
  },
  {
    href: "/studio/booth",
    number: "05",
    label: "Photobooth",
    detail: "On-set images and lightbox copy",
  },
  { href: "/studio/praise", number: "06", label: "Praise", detail: "Testimonials and attribution" },
  {
    href: "/studio/experience",
    number: "07",
    label: "Experience",
    detail: "Career reel and scenes",
  },
  {
    href: "/studio/room",
    number: "08",
    label: "Drawing Room",
    detail: "Invitation and mood board",
  },
  {
    href: "/studio/contact",
    number: "09",
    label: "Contact",
    detail: "Project invitation and contact details",
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
              </span>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
