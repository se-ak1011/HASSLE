import { getActiveRegionConfig } from '@/localization/RegionContext';

export type RegionDateStyle = 'short' | 'medium' | 'long';

function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function formatDateForRegion(date: Date, style: RegionDateStyle = 'short'): string {
  const config = getActiveRegionConfig();
  return date.toLocaleDateString(config.locale, config.date[style]);
}

export function formatDateStringForRegion(
  dateStr: string,
  style: RegionDateStyle = 'short'
): string {
  try {
    return formatDateForRegion(parseLocalDate(dateStr), style);
  } catch {
    return dateStr;
  }
}

export function formatDateRangeForRegion(startStr: string, endStr: string): string {
  try {
    return `${formatDateStringForRegion(startStr, 'medium')} — ${formatDateStringForRegion(endStr, 'medium')}`;
  } catch {
    return `${startStr} — ${endStr}`;
  }
}

export function formatDateTimeForRegion(date: Date): string {
  const config = getActiveRegionConfig();
  return date.toLocaleString(config.locale, config.date.dateTime);
}
