import Link from "next/link";
import type { Contact, Settings } from "@/schemas";

type FooterProps = Readonly<{
  contact: Contact | null;
  settings: Settings;
}>;

function ExternalLink({ href, label }: Readonly<{ href: string | null; label: string }>) {
  if (!href) return null;

  return (
    <a
      className={`public-footer__social public-footer__social--${label.toLowerCase()}`}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export function Footer({ contact, settings }: FooterProps) {
  const year = new Date().getFullYear();
  const { brand, footer } = settings.site;

  return (
    <footer className="public-footer">
      <div className="wrap public-footer__grid">
        <div className="public-footer__brand">
          <span className="public-footer__eyebrow">{footer.eyebrow}</span>
          <Link className="brand" href="/" aria-label={brand.homeLabel}>
            <span className="brand__name">{brand.name}</span>
            <span className="brand__suffix">{brand.suffix}</span>
          </Link>
          {contact ? <p>{contact.footerTagline}</p> : null}
          {contact?.availableForFreelance ? (
            <span className="footer-status">
              <span className="footer-status__blip" aria-hidden="true" />
              {contact.footerStatus}
            </span>
          ) : null}
        </div>

        <div className="public-footer__skills">
          <span className="public-footer__eyebrow">{footer.craftEyebrow}</span>
          <h2>{footer.craftHeading}</h2>
          <p>{footer.craftDescription}</p>
          <div aria-label="Editing skills">
            {footer.skills.map((skill) => (
              <span key={skill.id}>
                <i>{skill.number}</i>
                {skill.label}
              </span>
            ))}
          </div>
        </div>

        <nav className="public-footer__column" aria-label={footer.exploreHeading}>
          <h2>{footer.exploreHeading}</h2>
          <Link href="/#work">{footer.selectedWorkLabel}</Link>
          <Link href="/#photobooth">{footer.photoboothLabel}</Link>
          <Link href="/#experience">{footer.experienceLabel}</Link>
          <Link href="/room">{footer.drawingRoomLabel}</Link>
        </nav>

        {contact ? (
          <div className="public-footer__column">
            <h2>{footer.contactHeading}</h2>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <span>{contact.location}</span>
            <div className="public-footer__socials" aria-label="Social links">
              <ExternalLink href={contact.socials.linkedin} label="LinkedIn" />
              <ExternalLink href={contact.socials.instagram} label="Instagram" />
              <ExternalLink href={contact.socials.youtube} label="YouTube" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="wrap public-footer__bottom">
        <span>
          {footer.copyrightPrefix} {year} {settings.site.ownerName}
        </span>
        <span>{footer.closingLine}</span>
      </div>
    </footer>
  );
}
