"use server";

import { headers } from "next/headers";
import { requireOwner, signOut } from "@/auth";
import { getDb } from "@/lib/db";
import {
  delayAfterFailure,
  loginThrottleKeys,
  recordLoginSuccess,
  reserveLoginAttempt,
} from "@/lib/login-throttle";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/credential-limits";
import { hashPassword, verifyPassword } from "@/lib/password";

export type ChangePasswordResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>;

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return { ok: false, error: "Enter your current and new password." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `New password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`,
    };
  }
  if (currentPassword.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: "Current password is incorrect." };
  }

  try {
    const user = await requireOwner();
    // A session alone must not be a way to guess the password, so this check shares the
    // sign-in throttle and its counters.
    const keys = loginThrottleKeys(user.email, await headers());
    const attempt = await reserveLoginAttempt(keys);
    if (!attempt.allowed) {
      return { ok: false, error: "Too many attempts. Wait a while and try again." };
    }
    if (!user.password || !(await verifyPassword(currentPassword, user.password))) {
      await delayAfterFailure(attempt.attempts);
      return { ok: false, error: "Current password is incorrect." };
    }
    await recordLoginSuccess(keys);

    const password = await hashPassword(newPassword);
    const db = getDb();
    // The new password ends every existing session, on every device, this one included.
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { password } }),
      db.session.deleteMany({ where: { userId: user.id } }),
    ]);
    await signOut({ redirect: false });
    return { ok: true };
  } catch (error) {
    console.error("changePassword failed", error);
    return { ok: false, error: "Could not change the password. Please try again." };
  }
}

/** Ends the Studio session and returns to the sign-in page. */
export async function logout() {
  await signOut({ redirectTo: "/login" });
}
