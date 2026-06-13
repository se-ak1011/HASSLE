/**
 * Hassle — Export Service
 *
 * Generates a clean PDF summary of the last 7 days of tracked data
 * and opens the native share sheet so the user can save or send it.
 *
 * Uses:
 *  - expo-print  → HTML → PDF file on device
 *  - expo-sharing → native share sheet
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { loadHistory } from '@/services/storage';
import { DayState, EnergyMode } from '@/constants/types';

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateReadable(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateRange(startStr: string, endStr: string): string {
  try {
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString(undefined, opts)} — ${end.toLocaleDateString(undefined, opts)}`;
  } catch {
    return `${startStr} — ${endStr}`;
  }
}

// ─── Unit Formatting ──────────────────────────────────────────────────────────

function formatUnit(value: number, mode: EnergyMode): string {
  if (mode === 'battery') return `${value}%`;
  return `${value} spoon${value !== 1 ? 's' : ''}`;
}

// ─── Stats Calculation ────────────────────────────────────────────────────────

interface DailySummary {
  date: string;
  dateReadable: string;
  energyMode: EnergyMode;
  energyLevel: number;
  energyUsed: number;
  isFlareDay: boolean;
  tasksCompleted: number;
  tags: string[];
}

interface WeeklyStats {
  days: DailySummary[];
  avgEnergyStarted: number;
  avgEnergyUsed: number;
  totalFlareDays: number;
  mostDemandingTask: string | null;
  topTags: { tag: string; count: number }[];
  dominantMode: EnergyMode;
  dateRange: string;
  totalTasksCompleted: number;
}

function computeStats(days: DayState[]): WeeklyStats {
  // Daily summaries
  const summaries: DailySummary[] = days.map((d) => {
    const completedTasks = d.tasks.filter((t) => t.status === 'completed');
    const energyUsed = completedTasks.reduce(
      (sum, t) => sum + (t.completedCost ?? t.effectiveCost ?? t.baseCost),
      0
    );
    return {
      date: d.date,
      dateReadable: formatDateReadable(d.date),
      energyMode: d.energyMode,
      energyLevel: d.energyLevel,
      energyUsed,
      isFlareDay: d.isFlareDay,
      tasksCompleted: completedTasks.length,
      tags: d.tags,
    };
  });

  // Averages
  const avgEnergyStarted =
    summaries.length > 0
      ? Math.round(summaries.reduce((s, d) => s + d.energyLevel, 0) / summaries.length)
      : 0;

  const avgEnergyUsed =
    summaries.length > 0
      ? Math.round(summaries.reduce((s, d) => s + d.energyUsed, 0) / summaries.length)
      : 0;

  // Flare days
  const totalFlareDays = summaries.filter((d) => d.isFlareDay).length;

  // Most demanding task — highest average baseCost across all days
  const taskTotals: Record<string, { total: number; count: number }> = {};
  for (const d of days) {
    for (const t of d.tasks) {
      if (t.status === 'completed') {
        if (!taskTotals[t.name]) taskTotals[t.name] = { total: 0, count: 0 };
        taskTotals[t.name].total += t.baseCost;
        taskTotals[t.name].count += 1;
      }
    }
  }
  let mostDemandingTask: string | null = null;
  let maxAvgCost = 0;
  for (const [name, { total, count }] of Object.entries(taskTotals)) {
    const avg = total / count;
    if (avg > maxAvgCost) {
      maxAvgCost = avg;
      mostDemandingTask = name;
    }
  }

  // Top tags
  const tagCounts: Record<string, number> = {};
  for (const d of summaries) {
    for (const tag of d.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // Dominant mode
  const batteryCount = summaries.filter((d) => d.energyMode === 'battery').length;
  const dominantMode: EnergyMode = batteryCount >= summaries.length / 2 ? 'battery' : 'spoon';

  // Date range string
  const sorted = [...summaries].sort((a, b) => a.date.localeCompare(b.date));
  const dateRange =
    sorted.length > 0
      ? formatDateRange(sorted[0].date, sorted[sorted.length - 1].date)
      : 'No data';

  const totalTasksCompleted = summaries.reduce((s, d) => s + d.tasksCompleted, 0);

  return {
    days: summaries.sort((a, b) => b.date.localeCompare(a.date)), // newest first
    avgEnergyStarted,
    avgEnergyUsed,
    totalFlareDays,
    mostDemandingTask,
    topTags,
    dominantMode,
    dateRange,
    totalTasksCompleted,
  };
}

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildHTML(stats: WeeklyStats): string {
  const {
    days,
    avgEnergyStarted,
    avgEnergyUsed,
    totalFlareDays,
    mostDemandingTask,
    topTags,
    dominantMode,
    dateRange,
    totalTasksCompleted,
  } = stats;

  // Daily rows
  const dailyRows = days
    .map((d) => {
      const used = formatUnit(d.energyUsed, d.energyMode);
      const total = formatUnit(d.energyLevel, d.energyMode);
      const flareLabel = d.isFlareDay
        ? `<span class="flare-badge">Flare day</span>`
        : '';
      const tagText =
        d.tags.length > 0
          ? d.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')
          : '<span class="none">—</span>';

      return `
        <tr>
          <td class="date-cell">${escapeHtml(d.dateReadable)}${flareLabel}</td>
          <td class="center">${d.tasksCompleted}</td>
          <td class="center">${used} <span class="of-total">/ ${total}</span></td>
          <td class="tags-cell">${tagText}</td>
        </tr>
      `;
    })
    .join('');

  // Top tags list
  const topTagsHtml =
    topTags.length > 0
      ? topTags
          .map(
            ({ tag, count }) =>
              `<li><span class="tag-name">${escapeHtml(tag)}</span><span class="tag-count">${count}x</span></li>`
          )
          .join('')
      : '<li class="none">No tags recorded</li>';

  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const unitLabel = dominantMode === 'battery' ? '%' : 'spoons';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hassle — Energy Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #f9f8f6;
      color: #2c2a27;
      font-size: 14px;
      line-height: 1.6;
      padding: 48px 40px;
      max-width: 760px;
      margin: 0 auto;
    }

    /* ── Header ───────────────────────────────────────── */
    .header {
      border-bottom: 2px solid #d8d4ce;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .app-name {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #8a8278;
      margin-bottom: 6px;
    }
    .report-title {
      font-size: 26px;
      font-weight: 700;
      color: #1c1a18;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .date-range {
      font-size: 13px;
      color: #7a7570;
      font-style: italic;
    }
    .generated {
      font-size: 11px;
      color: #9e9990;
      margin-top: 6px;
    }

    /* ── Section ─────────────────────────────────────── */
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #8a8278;
      border-bottom: 1px solid #e0dbd4;
      padding-bottom: 6px;
      margin-bottom: 14px;
    }

    /* ── Summary grid ─────────────────────────────────── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    .stat-card {
      background: #fff;
      border: 1px solid #e0dbd4;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #4a5a3a;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 11px;
      color: #8a8278;
      margin-top: 3px;
      font-weight: 500;
    }
    .stat-card.flare .stat-value { color: #9b5a4a; }
    .stat-card.tasks .stat-value { color: #3a5a8a; }

    .detail-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .detail-card {
      background: #fff;
      border: 1px solid #e0dbd4;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .detail-label {
      font-size: 11px;
      color: #8a8278;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 15px;
      font-weight: 600;
      color: #2c2a27;
    }
    .detail-value.muted { color: #8a8278; font-style: italic; font-weight: 400; }

    /* ── Tag list ─────────────────────────────────────── */
    .tag-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .tag-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      border: 1px solid #e0dbd4;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .tag-name {
      font-size: 13px;
      color: #2c2a27;
      font-weight: 500;
    }
    .tag-count {
      font-size: 12px;
      color: #8a8278;
      font-weight: 600;
    }
    .none { color: #9e9990; font-style: italic; }

    /* ── Daily table ─────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #e0dbd4;
      border-radius: 10px;
      overflow: hidden;
    }
    thead {
      background: #f0ede8;
    }
    th {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #7a7570;
      padding: 10px 14px;
      text-align: left;
    }
    td {
      font-size: 13px;
      color: #2c2a27;
      padding: 11px 14px;
      vertical-align: top;
      border-top: 1px solid #e8e4de;
    }
    tr:first-child td { border-top: none; }
    .center { text-align: center; }
    .date-cell { font-weight: 600; font-size: 13px; min-width: 120px; }
    .of-total { color: #9e9990; font-size: 11px; }
    .tags-cell { max-width: 200px; }

    .flare-badge {
      display: inline-block;
      background: #f5ece9;
      color: #9b5a4a;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-radius: 4px;
      padding: 2px 5px;
      margin-left: 6px;
      vertical-align: middle;
    }

    .tag {
      display: inline-block;
      background: #f0ede8;
      color: #6a6460;
      font-size: 10px;
      font-weight: 500;
      border-radius: 4px;
      padding: 2px 6px;
      margin: 1px 2px 1px 0;
    }

    /* ── Footer ──────────────────────────────────────── */
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e0dbd4;
      font-size: 11px;
      color: #9e9990;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-note {
      font-style: italic;
      max-width: 60%;
      line-height: 1.5;
    }
    .future-note {
      background: #f5f3f0;
      border: 1px solid #e0dbd4;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #8a8278;
      font-style: italic;
      margin-top: 20px;
      text-align: center;
    }

    @media print {
      body { padding: 20px; background: #fff; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="app-name">Hassle · Energy Tracker</div>
    <h1 class="report-title">Weekly Energy Report</h1>
    <div class="date-range">${escapeHtml(dateRange)}</div>
    <div class="generated">Generated ${escapeHtml(generatedDate)}</div>
  </div>

  <!-- Summary -->
  <div class="section">
    <div class="section-title">Summary</div>
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-value">${days.length}</div>
        <div class="stat-label">Days tracked</div>
      </div>
      <div class="stat-card tasks">
        <div class="stat-value">${totalTasksCompleted}</div>
        <div class="stat-label">Tasks completed</div>
      </div>
      <div class="stat-card flare">
        <div class="stat-value">${totalFlareDays}</div>
        <div class="stat-label">Flare day${totalFlareDays !== 1 ? 's' : ''}</div>
      </div>
    </div>
    <div class="detail-cards">
      <div class="detail-card">
        <div class="detail-label">Avg energy at start of day</div>
        <div class="detail-value">${formatUnit(avgEnergyStarted, dominantMode)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Avg energy used per day</div>
        <div class="detail-value">${formatUnit(avgEnergyUsed, dominantMode)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Tracking unit</div>
        <div class="detail-value">${dominantMode === 'battery' ? 'Battery (%)' : 'Spoon theory'}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Most demanding task</div>
        <div class="detail-value ${mostDemandingTask ? '' : 'muted'}">${mostDemandingTask ? escapeHtml(mostDemandingTask) : 'Not enough data'}</div>
      </div>
    </div>
  </div>

  <!-- Symptoms / tags -->
  <div class="section">
    <div class="section-title">Most common symptoms &amp; notes</div>
    <ul class="tag-list">
      ${topTagsHtml}
    </ul>
  </div>

  <!-- Daily breakdown -->
  <div class="section">
    <div class="section-title">Daily breakdown</div>
    ${
      days.length === 0
        ? '<p class="none">No completed days in this period.</p>'
        : `<table>
          <thead>
            <tr>
              <th>Date</th>
              <th class="center">Tasks done</th>
              <th class="center">Energy used</th>
              <th>Tags / notes</th>
            </tr>
          </thead>
          <tbody>${dailyRows}</tbody>
        </table>`
    }
  </div>

  <!-- Future note -->
  <div class="future-note">
    More export options coming — CSV format and longer date ranges.
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-note">
      This report was generated privately on your device. No data was sent to any server.
      Intended for personal use and sharing with healthcare providers.
    </div>
    <div>Hassle App</div>
  </div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ExportResult {
  success: boolean;
  error?: string;
  daysFound: number;
}

/**
 * Generates a PDF of the last 7 completed days and opens the share sheet.
 */
export async function exportLast7Days(): Promise<ExportResult> {
  try {
    // Load history and filter to last 7 days
    const history = await loadHistory();
    const cutoff = getDateString(7);
    const recent = history.filter((d) => d.date >= cutoff).slice(0, 7);

    if (recent.length === 0) {
      return { success: false, error: 'no_data', daysFound: 0 };
    }

    const stats = computeStats(recent);
    const html = buildHTML(stats);

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Check if sharing is available (it should be on iOS/Android)
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: 'sharing_unavailable', daysFound: recent.length };
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Hassle Report',
      UTI: 'com.adobe.pdf',
    });

    return { success: true, daysFound: recent.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message, daysFound: 0 };
  }
}

// ─── Doctor-visit / Clinical Report (Hassle Plus) ─────────────────────────────
// A longer-range, appointment-ready summary: aggregate trends plus a
// chronological symptom & reflection log pulled from the guided prompts.

function buildClinicalHTML(
  stats: WeeklyStats,
  rawDays: DayState[],
  daysBack: number
): string {
  const mode = stats.dominantMode;
  const generated = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const flarePct =
    stats.days.length > 0
      ? Math.round((stats.totalFlareDays / stats.days.length) * 100)
      : 0;

  const overview = `
    <div class="grid">
      <div class="stat"><div class="num">${stats.days.length}</div><div class="lbl">days tracked</div></div>
      <div class="stat"><div class="num">${formatUnit(stats.avgEnergyStarted, mode)}</div><div class="lbl">avg energy at start</div></div>
      <div class="stat"><div class="num">${formatUnit(stats.avgEnergyUsed, mode)}</div><div class="lbl">avg energy used</div></div>
      <div class="stat"><div class="num">${stats.totalFlareDays} <span class="pct">(${flarePct}%)</span></div><div class="lbl">flare days</div></div>
      <div class="stat"><div class="num">${stats.totalTasksCompleted}</div><div class="lbl">tasks completed</div></div>
      <div class="stat"><div class="num">${stats.mostDemandingTask ? escapeHtml(stats.mostDemandingTask) : '—'}</div><div class="lbl">most demanding task</div></div>
    </div>`;

  const tagRows = stats.topTags
    .map(
      (t) =>
        `<tr><td>${escapeHtml(t.tag)}</td><td class="r">${t.count} day${t.count !== 1 ? 's' : ''}</td></tr>`
    )
    .join('');
  const tagsTable = stats.topTags.length
    ? `<h2>Most common tags</h2><table>${tagRows}</table>`
    : '';

  const logRows = stats.days
    .map(
      (d) => `
      <tr>
        <td>${escapeHtml(d.dateReadable)}</td>
        <td class="r">${formatUnit(d.energyLevel, d.energyMode)}</td>
        <td class="r">${formatUnit(d.energyUsed, d.energyMode)}</td>
        <td class="c">${d.isFlareDay ? '●' : ''}</td>
        <td class="r">${d.tasksCompleted}</td>
        <td>${d.tags.map(escapeHtml).join(', ')}</td>
      </tr>`
    )
    .join('');

  // Symptom & reflection notes, newest first, only days that have content.
  const sortedRaw = [...rawDays].sort((a, b) => b.date.localeCompare(a.date));
  const noteBlocks = sortedRaw
    .map((d) => {
      const gp = d.guidedPrompts ?? {};
      const parts: string[] = [];
      if (gp.symptoms) parts.push(`<p><b>Symptoms:</b> ${escapeHtml(gp.symptoms)}</p>`);
      if (gp.drained) parts.push(`<p><b>Drained by:</b> ${escapeHtml(gp.drained)}</p>`);
      if (gp.helped) parts.push(`<p><b>Helped:</b> ${escapeHtml(gp.helped)}</p>`);
      if (d.journalEntry) parts.push(`<p>${escapeHtml(d.journalEntry)}</p>`);
      if (parts.length === 0) return '';
      return `<div class="note"><div class="note-date">${escapeHtml(
        formatDateReadable(d.date)
      )}${d.isFlareDay ? ' · <span class="flare">flare</span>' : ''}</div>${parts.join('')}</div>`;
    })
    .filter(Boolean)
    .join('');
  const notesSection = noteBlocks
    ? `<h2>Symptom &amp; reflection log</h2>${noteBlocks}`
    : '';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #2a2333; margin: 0; padding: 36px 40px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b5b7e; margin: 28px 0 10px; border-bottom: 1px solid #e7e0ee; padding-bottom: 6px; }
  .meta { color: #8a7f97; font-size: 12px; margin-bottom: 4px; }
  .disclaimer { color: #8a7f97; font-size: 11px; font-style: italic; margin: 10px 0 4px; }
  .grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .stat { flex: 1 1 30%; min-width: 150px; background: #f6f2fa; border: 1px solid #e7e0ee; border-radius: 10px; padding: 12px 14px; }
  .num { font-size: 18px; font-weight: 700; color: #4a3a63; }
  .num .pct { font-size: 12px; font-weight: 500; color: #8a7f97; }
  .lbl { font-size: 11px; color: #8a7f97; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee6f2; }
  th { color: #8a7f97; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em; }
  td.r { text-align: right; } td.c { text-align: center; color: #b4467e; }
  .note { margin-bottom: 12px; padding: 10px 12px; background: #faf8fc; border-left: 3px solid #c9b8dd; border-radius: 4px; }
  .note-date { font-size: 11px; font-weight: 700; color: #6b5b7e; margin-bottom: 4px; }
  .note p { margin: 2px 0; font-size: 12px; line-height: 1.5; }
  .flare { color: #b4467e; font-weight: 700; }
  .footer { margin-top: 32px; color: #b3a8c0; font-size: 10px; text-align: center; }
</style></head>
<body>
  <h1>Hassle — Symptom &amp; Energy Summary</h1>
  <div class="meta">${stats.dateRange} · last ${daysBack} days</div>
  <div class="meta">Generated ${generated}</div>
  <div class="disclaimer">Self-reported data from the Hassle app. Intended to support a conversation with a clinician, not a medical record.</div>
  ${overview}
  ${notesSection}
  <h2>Daily log</h2>
  <table>
    <tr><th>Date</th><th class="r">Start</th><th class="r">Used</th><th class="c">Flare</th><th class="r">Done</th><th>Tags</th></tr>
    ${logRows}
  </table>
  ${tagsTable}
  <div class="footer">Made with Hassle — a daily planner for bodies that don't cooperate.</div>
</body></html>`;
}

/**
 * Generates a longer-range clinical PDF (Hassle Plus) and opens the share sheet.
 * @param daysBack how far back to include (e.g. 30 or 90).
 */
export async function exportClinicalReport(daysBack: number = 30): Promise<ExportResult> {
  try {
    const history = await loadHistory();
    const cutoff = getDateString(daysBack);
    const recent = history.filter((d) => d.date >= cutoff);

    if (recent.length === 0) {
      return { success: false, error: 'no_data', daysFound: 0 };
    }

    const stats = computeStats(recent);
    const html = buildClinicalHTML(stats, recent, daysBack);

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: 'sharing_unavailable', daysFound: recent.length };
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Hassle — Clinical Summary',
      UTI: 'com.adobe.pdf',
    });

    return { success: true, daysFound: recent.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message, daysFound: 0 };
  }
}
