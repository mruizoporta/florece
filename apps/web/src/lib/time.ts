/** API may return "HH:MM" or an ISO datetime. */
export function formatSlotTime(start: string): string {
  if (start.length >= 16 && start.includes("T")) {
    return start.slice(11, 16);
  }
  return start.slice(0, 5);
}
