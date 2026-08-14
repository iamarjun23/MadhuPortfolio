export function getSiteUrl(domain: string) {
  const candidate = domain.startsWith("http") ? domain : `https://${domain}`;

  try {
    return new URL(candidate);
  } catch {
    return new URL("https://madhu.edit");
  }
}
