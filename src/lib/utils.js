import clsx from "clsx";
import { twMerge } from "tailwind-merge";
/** Unisce classi Tailwind evitando conflitti/duplicati */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
