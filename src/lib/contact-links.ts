/** A wa.me chat link. wa.me takes the number as bare digits, country code first. */
export function whatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/** A tel: link that keeps only the digits and a leading +. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * An email that asks for a callback, with the details the call needs already
 * laid out for the visitor to fill in.
 */
export function callbackHref(email: string) {
  const subject = encodeURIComponent("Callback request");
  const body = encodeURIComponent("Name:\nPhone:\nBest time to call:");
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/** A profile URL shown without its host: https://linkedin.com/in/x/ -> /in/x. */
export function profilePath(url: string) {
  return new URL(url).pathname.replace(/\/+$/, "") || url;
}

/** The city from a location like "Bengaluru, Karnataka, India". */
export function cityOf(location: string) {
  return location.split(",")[0]!.trim();
}

/** Whether the runtime knows this IANA time zone, e.g. "Asia/Kolkata". */
export function isTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
