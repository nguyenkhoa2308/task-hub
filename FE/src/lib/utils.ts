import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDays(dueDateString?: string | Date): string {
  if (!dueDateString) return "";
  const due = new Date(dueDateString);
  const now = new Date();

  // Reset hours to start of day for accurate calendar day difference
  const dueZero = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffTime = dueZero - nowZero;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Còn 1 ngày";
  if (diffDays > 1) return `Còn ${diffDays} ngày`;
  return `Quá ${Math.abs(diffDays)} ngày`;
}
