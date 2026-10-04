import Link from "next/link";
import { AvailabilityCard } from "@/components/studio/AvailabilityCard";
import { SettingsDangerZone } from "@/components/studio/SettingsDangerZone";
import { ShareImage } from "@/components/studio/ShareImage";
import { Status } from "@/generated/prisma/client";
import { getContact, getResume, getSettings, getWork } from "@/lib/content";
import { type DraftPart, partEdited } from "@/lib/draft-diff";
import { publishChecks } from "@/lib/publish-checks";
import { type SectionKey, sectionKeys } from "@/lib/sections";
import { getRecentActivity, getSectionRows, getStorageUsage } from "@/lib/studio";
import { getStudioDraftVersion } from "@/lib/studio-drafts";
import { studioHref, studioTabs } from "@/lib/studio-nav";

/* The settings editors with no tab of their own. Between them and the Navbar and
   Footer tabs every key of the settings draft is covered, so an edit anywhere in
   it shows up as "Edited" on exactly one row of this page. */
const siteDetails: ReadonlyArray<{
  href: string;
  label: string;
  detail: string;
  part: DraftPart;
}> = [
  {
    href: studioHref("/settings?open=seo"),
    label: "Google and sharing",
    detail: "Page title, description and share image",
    part: { only: ["seo"] },
  },
  {
    href: studioHref("/settings?open=site.brand"),
    label: "Brand",
    detail: "The wordmark in the navbar and footer",
    part: { only: ["site.brand"] },
  },
  {
    href: studioHref("/settings"),
    label: "Look and domain",
    detail: "Motion, stand-in photo, owner name and domain",
    part: { only: ["appearance", "fallbackImage", "domain", "site.ownerName"] },
  },
];

function getRelativeTime(date: Date) {
  const minutes = Math.floor(Math.max(0, Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function formatStorage(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

function StatusPill({ edited }: Readonly<{ edited: boolean }>) {
  return (
    <span className={`studio-settings__pill${edited ? " is-edited" : ""}`}>
      {edited ? "Edited" : "Live"}
    </span>
  );
}

export default async function StudioMenuPage() {
  const [activity, rows, storage, contact, contactVersion, settings, resume, work] =
    await Promise.all([
      getRecentActivity(),
      getSectionRows(),
      getStorageUsage(),
      getContact(Status.DRAFT),
      getStudioDraftVersion("contact"),
      getSettings(Status.DRAFT),
      getResume(Status.DRAFT),
      getWork(Status.DRAFT),
    ]);

  const drafts = rows.filter((row) => row.status === Status.DRAFT);
  const isEdited = (section: SectionKey, part?: DraftPart) => partEdited(rows, section, part);
  const sections = studioTabs.flatMap((tab) =>
    tab.section
      ? [
          {
            ...tab,
            edited: isEdited(tab.section, tab.part),
            savedAt: drafts.find((draft) => draft.key === tab.section)?.updatedAt,
          },
        ]
      : [],
  );
  const details = siteDetails.map((item) => ({
    ...item,
    edited: isEdited("settings", item.part),
  }));
  const editedCount = [...sections, ...details].filter((item) => item.edited).length;
  const lastPublished = rows
    .filter((row) => row.status === Status.PUBLISHED)
    .reduce<Date | null>(
      (latest, row) => (latest && latest > row.updatedAt ? latest : row.updatedAt),
      null,
    );
  const checks = publishChecks({
    resume,
    settings,
    work,
    contact,
    drafts: sectionKeys.flatMap((key) => {
      const draft = drafts.find((row) => row.key === key);
      return draft ? [{ key, data: draft.data }] : [];
    }),
  });
  const { title, description, ogImage } = settings.seo;

  return (
    <section className="studio-page studio-settings" aria-labelledby="studio-menu-title">
      <div className="studio-settings__head">
        <header className="studio-settings__intro">
          <span className="slate">{settings.domain || "Whole site"}</span>
          <h1 id="studio-menu-title">Menu</h1>
          <p>
            {editedCount === 0
              ? "Everything here is live."
              : `${editedCount} ${editedCount === 1 ? "part has" : "parts have"} changes waiting for Publish.`}
          </p>
        </header>

        <div className="studio-settings__tiles">
          <AvailabilityCard contact={contact} version={contactVersion} />
          <div className="studio-settings__tile">
            <span>Not live yet</span>
            <strong>{editedCount === 0 ? "Nothing" : `${editedCount} edited`}</strong>
          </div>
          <div className="studio-settings__tile">
            <span>Last published</span>
            <strong>
              {lastPublished ? (
                <time dateTime={lastPublished.toISOString()}>{getRelativeTime(lastPublished)}</time>
              ) : (
                "Never"
              )}
            </strong>
          </div>
          <div className="studio-settings__tile">
            <span>{`Storage · ${storage.files} ${storage.files === 1 ? "file" : "files"}`}</span>
            <strong>{formatStorage(storage.bytes)}</strong>
          </div>
        </div>
      </div>

      <div className="studio-settings__columns">
        <div>
          <section className="studio-settings__card" aria-labelledby="sections-title">
            <h2 id="sections-title">Sections</h2>
            <ol className="studio-settings__sections">
              {sections.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span>
                      {item.label}
                      {item.edited && item.savedAt ? (
                        <small>{` · saved ${getRelativeTime(item.savedAt).toLowerCase()}`}</small>
                      ) : null}
                    </span>
                    <StatusPill edited={item.edited} />
                    <b aria-hidden="true">&rsaquo;</b>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div>
          <section className="studio-settings__card" aria-labelledby="checks-title">
            <h2 id="checks-title">Before you publish</h2>
            <ul className="studio-settings__checks">
              {checks.map((check) => (
                <li key={check.label} className={check.ok ? undefined : "needs-fix"}>
                  <i aria-hidden="true" />
                  <span>{check.label}</span>
                  {check.ok ? null : <Link href={studioHref(check.path)}>Fix</Link>}
                </li>
              ))}
            </ul>
          </section>

          <section className="studio-settings__card" aria-labelledby="activity-title">
            <h2 id="activity-title">Recent changes</h2>
            {activity.length > 0 ? (
              <ul className="studio-activity">
                {activity.map((item) => (
                  <li key={item.id}>
                    <span>{item.message}</span>
                    <time dateTime={item.createdAt.toISOString()}>
                      {getRelativeTime(item.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nothing saved yet. Pick a section to start editing.</p>
            )}
          </section>
        </div>

        <div>
          <section className="studio-settings__card" aria-labelledby="site-details-title">
            <h2 id="site-details-title">Site details</h2>
            <ul className="studio-settings__links">
              {details.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <StatusPill edited={item.edited} />
                    <b aria-hidden="true">&rsaquo;</b>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="studio-settings__caption">How a shared link looks</p>
            <Link className="studio-settings__share" href={studioHref("/settings?open=seo")}>
              {ogImage ? (
                <ShareImage url={ogImage.url} />
              ) : (
                <span className="studio-settings__share-empty">No share image yet</span>
              )}
              <span>
                <small>{settings.domain}</small>
                <strong>{title || "No page title yet"}</strong>
                <small>{description || "No description yet"}</small>
              </span>
            </Link>
          </section>

          <SettingsDangerZone />
        </div>
      </div>
    </section>
  );
}
