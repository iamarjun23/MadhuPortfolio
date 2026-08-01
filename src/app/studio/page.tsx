import Link from "next/link";
import { getStudioDashboardData } from "@/lib/studio";

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
    <section className="studio-page" aria-labelledby="studio-dashboard-title">
      <span className="slate">Studio</span>
      <h1 id="studio-dashboard-title">Dashboard</h1>
      <p>Choose a section to edit the current draft.</p>
      <dl className="studio-stats">
        <div>
          <dt>Status</dt>
          <dd>{dashboard.hasUnpublishedChanges ? "Draft" : "Live"}</dd>
        </div>
        <div>
          <dt>Work items</dt>
          <dd>{dashboard.workItems}</dd>
        </div>
        <div>
          <dt>Testimonials</dt>
          <dd>{dashboard.testimonials}</dd>
        </div>
        <div>
          <dt>Photos</dt>
          <dd>{dashboard.photos}</dd>
        </div>
      </dl>
      <div className="studio-dashboard-grid">
        <section>
          <h2>Quick actions</h2>
          <div className="studio-quick-actions">
            <Link href="/studio/work">Edit work</Link>
            <Link href="/studio/booth">Edit booth</Link>
            <Link href="/studio/praise">Edit praise</Link>
          </div>
        </section>
        <section>
          <h2>Recent activity</h2>
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
            <p>No draft activity yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}
