import { updateTag } from "next/cache";
import type { SectionKey } from "@/lib/sections";

export function contentTag(key: SectionKey) {
  return `content:${key}`;
}

export function updateContent(key: SectionKey) {
  updateTag(contentTag(key));
}
