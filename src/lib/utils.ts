// FILE: src/lib/utils.ts
import type { ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/** Unisce classi Tailwind evitando conflitti/duplicati */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
