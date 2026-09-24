import { z } from "zod";

/* Links the studio stores are rendered straight into `href`s, where a `javascript:` or
   `data:` address would run on click. Each field accepts only what its purpose needs. */

/** A link off the site: https only. */
export const ExternalLinkSchema = z.url({ protocol: /^https$/ });

/** A path on this site (`/room`) or an anchor on the current page (`#work`). A leading `//`
    would be read as another host, so it is refused. */
export const InternalLinkSchema = z
  .string()
  .regex(/^(?:\/(?!\/)|#)[^\s\\]*$/, "Use a path on this site, like /room or #work.");

/** A button that may point either within the site or off it. */
export const LinkSchema = z.union([InternalLinkSchema, ExternalLinkSchema], {
  error: "Use a path on this site (like /room or #work) or an https:// link.",
});
