import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createSlugUrl(id: number, title: string): string {
  const slugTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${id}-${slugTitle}`;
}

export function extractIdFromSlug(slug: string): string {
  return slug.split("-")[0];
}
