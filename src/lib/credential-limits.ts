/* Bounds on what the sign-in and change-password forms accept. A separate, import-free
   module so the client form can share them without pulling the hashing code into the
   browser bundle. */

export const MIN_PASSWORD_LENGTH = 8;
// Long enough for any passphrase; anything longer is not a password anyone types.
export const MAX_PASSWORD_LENGTH = 256;
// RFC 5321's limit for a whole address; also keeps throttle keys short.
export const MAX_EMAIL_LENGTH = 254;
