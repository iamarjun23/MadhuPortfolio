/* Studio sign-ins are stateless JWTs, so on their own nothing could end one early: a copied
   cookie would keep working after logout or a password change until it expired. Each sign-in
   therefore also writes a `Session` row and the token carries that row's `sessionToken`. A
   session is live only while its row exists, has not expired and still belongs to the owner.
   Logout deletes the row; a password change deletes them all (src/auth.ts, actions/account.ts).
   Import-free so the rule can be tested without a database. */

/** A week, counted from sign-in. The row's expiry does not roll forward the way the cookie
    does, so even a session in daily use has to sign in again once a week. */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type StoredSession = Readonly<{
  expires: Date;
  user: Readonly<{ email: string; role: string }>;
}>;

/** True when the row behind a session token still grants owner access to `email`. */
export function isLiveSession(row: StoredSession | null, email: unknown, now: Date) {
  return row !== null && row.expires > now && row.user.role === "OWNER" && row.user.email === email;
}
