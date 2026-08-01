import { revalidateTag } from "next/cache";
import type { SectionKey } from "@/lib/sections";

export function contentTag(key: SectionKey) {
  return `content:${key}`;
}

export function revalidateContent(key: SectionKey) {
  revalidateTag(contentTag(key), "max");
}
