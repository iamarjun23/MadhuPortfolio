import Link from "next/link";
import type { Contact } from "@/schemas";

type FooterProps = Readonly<{
  contact: Contact | null;
}>;

function ExternalLink({ href, label }: Readonly<{ href: string | null; label: string }>) {
  if (!href) {
    return null;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

export function Footer({ contact }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="wrap public-footer__grid">
        <div className="public-footer__brand">
          <Link className="brand" href="/" aria-label="madhu.edit home">
            <span className="brand__dot" aria-hidden="true" />
            MADHU<span className="brand__sub">.edit</span>
          </Link>
          {contact ? <p>{contact.footerTagline}</p> : null}
          {contact?.availableForFreelance ? (
            <span className="footer-status">
              <span className="footer-status__blip" aria-hidden="true" />
              {contact.footerStatus}
            </span>
          ) : null}
        </div>

        <nav className="public-footer__column" aria-label="Explore">
          <h2>Explore</h2>
          <Link href="/#work">Selected work</Link>
          <Link href="/#photobooth">Photobooth</Link>
          <Link href="/#experience">Experience</Link>
          <Link href="/room">Drawing Room</Link>
        </nav>

        {contact ? (
          <div className="public-footer__column">
            <h2>Get in touch</h2>
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
        <span>Copyright {year} N Madhu Kumar</span>
        <span>The Editing Suite</span>
      </div>
    </footer>
  );
}
