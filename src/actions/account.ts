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

  // TEMPORARY diagnostic: `step` records how far this got so a failure says which
  // stage threw. Revert this whole block to a plain try/catch once the cause is found.
  let step = "requireOwner";
  try {
    const user = await requireOwner();

    step = "verifyPassword";
    if (!user.password || !(await verifyPassword(currentPassword, user.password))) {
      return { ok: false, error: "Current password is incorrect." };
    }

    step = "hashPassword";
    const password = await hashPassword(newPassword);

    step = "user.update";
    await getDb().user.update({ where: { id: user.id }, data: { password } });
    return { ok: true };
  } catch (error) {
    console.error(`changePassword failed at ${step}`, error);
    return {
      ok: false,
      error: `Failed at ${step}: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`,
    };
  }
}
