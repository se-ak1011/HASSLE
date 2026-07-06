// Small date helpers shared by the move/reschedule flow.

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Today + n days, as a YYYY-MM-DD string. */
export function addDays(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

/** "Jun 27" style short label for a YYYY-MM-DD string. */
export { formatDateStringForRegion as formatShortDate } from '@/services/regionFormat';
