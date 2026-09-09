"use server";

import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export type ChangePasswordResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: string }>;

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }

  try {
    const user = await requireOwner();
    if (!user.password || !(await verifyPassword(currentPassword, user.password))) {
      return { ok: false, error: "Current password is incorrect." };
    }

    const password = await hashPassword(newPassword);
    await getDb().user.update({ where: { id: user.id }, data: { password } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not change the password. Please try again." };
  }
}
