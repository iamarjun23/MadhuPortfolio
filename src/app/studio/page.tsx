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

  return (
    <section className="studio-page studio-dashboard" aria-labelledby="studio-dashboard-title">
      <div className="studio-dashboard__intro">
        <div>
          <span className="slate">Portfolio control room</span>
          <h1 id="studio-dashboard-title">Edit the story, scene by scene.</h1>
          <p>
            Every visible page section is editable here. Save changes as a draft, then publish when
            the whole edit feels right.
          </p>
        </div>
        <Link className="studio-dashboard__site-link" href="/studio/settings">
          Edit site chrome <span aria-hidden="true">→</span>
        </Link>
      </div>

      <dl className="studio-stats">
        <div>
          <dt>Publish state</dt>
          <dd>{dashboard.hasUnpublishedChanges ? "Draft ready" : "Live"}</dd>
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

      <section className="studio-section-map" aria-labelledby="studio-section-map-title">
        <header>
          <div>
            <span className="slate">Landing page map</span>
            <h2 id="studio-section-map-title">Choose what visitors see.</h2>
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

      <section className="studio-dashboard-grid">
        <div>
          <span className="slate">Shared layout</span>
          <h2>Navigation, footer & SEO</h2>
          <p>
            Change the brand, menu labels, footer, default appearance, and search preview in one
            place.
          </p>
          <Link href="/studio/settings">Open Site & Navigation →</Link>
        </div>
        <div>
          <span className="slate">Recent activity</span>
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
            <p>No draft activity yet. Start with the section that needs attention.</p>
          )}
        </div>
      </section>
    </section>
  );
}
