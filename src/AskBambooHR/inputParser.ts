// Input parser for extracting PTO fields from natural language user text.
// Used by golden path flows to dynamically populate draft cards.

import { employeeContext } from './employeeContext';

// ─── Types ───

export interface ParsedPTO {
  type: string | null;         // e.g., "Vacation", "Sick/Medical"
  startDate: string | null;    // ISO date string e.g., "2026-03-10"
  endDate: string | null;      // ISO date string e.g., "2026-03-14"
  hours: number | null;        // computed from weekday count * 8
}

// ─── PTO Type Extraction ───

const PTO_TYPE_MAP: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick/Medical',
  medical: 'Sick/Medical',
  personal: 'Personal',
  bereavement: 'Bereavement',
};

export function parsePTOType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, type] of Object.entries(PTO_TYPE_MAP)) {
    if (lower.includes(keyword)) return type;
  }
  return null;
}

// ─── Date Extraction ───

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

const DAY_NAME_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getToday(): Date {
  return new Date();
}

/** Get the next occurrence of a specific day of the week (never today) */
function getNextDayOfWeek(dayOfWeek: number): Date {
  const today = getToday();
  const currentDay = today.getDay();
  let daysAhead = dayOfWeek - currentDay;
  if (daysAhead <= 0) daysAhead += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + daysAhead);
  return result;
}

/** Get tomorrow's date */
function getTomorrow(): Date {
  const d = getToday();
  d.setDate(d.getDate() + 1);
  return d;
}

/** Get next business day (skip weekends) */
function getNextBusinessDay(): Date {
  const d = getTomorrow();
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** Get the Monday of next week */
function getNextMonday(): Date {
  return getNextDayOfWeek(1);
}

/** Infer year: if month/day is in the past, assume next year */
function inferYear(month: number, day: number): number {
  const today = getToday();
  const year = today.getFullYear();
  const candidate = new Date(year, month, day);
  // If the date is more than 14 days in the past, assume next year
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  if (candidate < twoWeeksAgo) {
    return year + 1;
  }
  return year;
}

/** Count weekdays between two dates (inclusive) */
function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

/**
 * Parse dates from user text. Returns { startDate, endDate } as ISO strings.
 * Handles:
 *   - "March 10-14", "March 10 to 14", "March 10 through 14"
 *   - "March 10 to March 14", "Mar 10 - Mar 14"
 *   - "March 10" (single day)
 *   - "3/10-3/14", "3/10 to 3/14"
 *   - "3/10" (single day)
 *   - "tomorrow", "this Friday", "next Monday"
 *   - "next week" (Mon-Fri)
 *   - Standalone day names: "Friday", "Monday"
 */
export function parseDates(text: string): { startDate: string | null; endDate: string | null } {
  const lower = text.toLowerCase().trim();

  // ── Relative dates ──

  // "tomorrow"
  if (/\btomorrow\b/.test(lower)) {
    const d = getTomorrow();
    const iso = toISO(d);
    return { startDate: iso, endDate: iso };
  }

  // "next week" → Monday through Friday of next week
  if (/\bnext\s+week\b/.test(lower)) {
    const mon = getNextMonday();
    // If we're already past Monday, getNextDayOfWeek gives next week's Monday
    // Get Friday of that same week
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    return { startDate: toISO(mon), endDate: toISO(fri) };
  }

  // "this/next <dayName>" e.g., "this Friday", "next Monday"
  const prefixedDay = lower.match(/\b(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/);
  if (prefixedDay) {
    const dayNum = DAY_NAME_MAP[prefixedDay[2]];
    if (dayNum !== undefined) {
      const d = getNextDayOfWeek(dayNum);
      // "next" may mean the week after if "this" would also match
      if (prefixedDay[1] === 'next') {
        const thisOccurrence = getNextDayOfWeek(dayNum);
        const today = getToday();
        const daysUntil = Math.round((thisOccurrence.getTime() - today.getTime()) / 86400000);
        // If it's less than 7 days away, "next" means the one after
        if (daysUntil <= 7) {
          d.setDate(thisOccurrence.getDate() + 7);
        }
      }
      const iso = toISO(d);
      return { startDate: iso, endDate: iso };
    }
  }

  // ── Numeric date ranges: "3/10-3/14", "3/10 to 3/14", "3/10 - 3/14" ──
  const numericRange = text.match(/(\d{1,2})\/(\d{1,2})\s*(?:-|to|through)\s*(\d{1,2})\/(\d{1,2})/i);
  if (numericRange) {
    const [, sm, sd, em, ed] = numericRange;
    const startMonth = parseInt(sm) - 1;
    const startDay = parseInt(sd);
    const endMonth = parseInt(em) - 1;
    const endDay = parseInt(ed);
    const startYear = inferYear(startMonth, startDay);
    const endYear = inferYear(endMonth, endDay);
    return {
      startDate: toISO(new Date(startYear, startMonth, startDay)),
      endDate: toISO(new Date(endYear, endMonth, endDay)),
    };
  }

  // ── Single numeric date: "3/10" ──
  const singleNumeric = text.match(/(\d{1,2})\/(\d{1,2})(?!\s*(?:-|to|through))/);
  if (singleNumeric) {
    const month = parseInt(singleNumeric[1]) - 1;
    const day = parseInt(singleNumeric[2]);
    const year = inferYear(month, day);
    const iso = toISO(new Date(year, month, day));
    return { startDate: iso, endDate: iso };
  }

  // ── Named month + day range in same month: "March 10-14", "March 10 to 14", "March 10 through 14" ──
  const monthNames = Object.keys(MONTH_MAP).join('|');
  const sameMonthRange = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})\\s*(?:-|to|through)\\s*(\\d{1,2})\\b`, 'i');
  const sameMonthMatch = text.match(sameMonthRange);
  if (sameMonthMatch) {
    const month = MONTH_MAP[sameMonthMatch[1].toLowerCase()];
    const startDay = parseInt(sameMonthMatch[2]);
    const endDay = parseInt(sameMonthMatch[3]);
    const year = inferYear(month, startDay);
    return {
      startDate: toISO(new Date(year, month, startDay)),
      endDate: toISO(new Date(year, month, endDay)),
    };
  }

  // ── Cross-month range: "March 28 to April 1", "Mar 28 - Apr 1" ──
  const crossMonthRange = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})\\s*(?:-|to|through)\\s*(${monthNames})\\s+(\\d{1,2})\\b`, 'i');
  const crossMonthMatch = text.match(crossMonthRange);
  if (crossMonthMatch) {
    const startMonth = MONTH_MAP[crossMonthMatch[1].toLowerCase()];
    const startDay = parseInt(crossMonthMatch[2]);
    const endMonth = MONTH_MAP[crossMonthMatch[3].toLowerCase()];
    const endDay = parseInt(crossMonthMatch[4]);
    const startYear = inferYear(startMonth, startDay);
    const endYear = inferYear(endMonth, endDay);
    return {
      startDate: toISO(new Date(startYear, startMonth, startDay)),
      endDate: toISO(new Date(endYear, endMonth, endDay)),
    };
  }

  // ── Single named date: "March 10", "Apr 5" ──
  const singleNamedDate = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})\\b`, 'i');
  const singleNamedMatch = text.match(singleNamedDate);
  if (singleNamedMatch) {
    const month = MONTH_MAP[singleNamedMatch[1].toLowerCase()];
    const day = parseInt(singleNamedMatch[2]);
    const year = inferYear(month, day);
    const iso = toISO(new Date(year, month, day));
    return { startDate: iso, endDate: iso };
  }

  // ── Standalone day names: "Friday", "on Monday" ──
  const standaloneDayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|mon|tue|tues|wed|thu|thur|thurs|fri)\b/);
  if (standaloneDayMatch) {
    const dayNum = DAY_NAME_MAP[standaloneDayMatch[1]];
    if (dayNum !== undefined) {
      const d = getNextDayOfWeek(dayNum);
      const iso = toISO(d);
      return { startDate: iso, endDate: iso };
    }
  }

  return { startDate: null, endDate: null };
}

/**
 * Parse a single date from user text (for conversational edits like "make it March 17").
 * Returns an ISO date string or null.
 */
export function parseSingleDate(text: string): string | null {
  const result = parseDates(text);
  return result.startDate;
}

// ─── Full PTO Parsing ───

/**
 * Parse all PTO fields from user text.
 * Returns whatever can be extracted — nulls for anything not found.
 */
export function parsePTORequest(text: string): ParsedPTO {
  const type = parsePTOType(text);
  const { startDate, endDate } = parseDates(text);

  let hours: number | null = null;
  if (startDate && endDate) {
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const weekdays = countWeekdays(start, end);
    hours = weekdays * 8;
  }

  return { type, startDate, endDate, hours };
}

// ─── Balance Lookup ───

export function getBalance(type: string): number {
  const entry = employeeContext.timeOff.balances.find(b => b.type === type);
  return entry?.available ?? 0;
}

// ─── Readable Date Formatting ───

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Format a date range for the post-submit confirmation.
 *  "March 10" for single day, "March 10\u201314" for same month, "March 28 \u2013 April 1" for cross-month.
 */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO + 'T12:00:00');
  const end = new Date(endISO + 'T12:00:00');

  const startMonth = MONTH_NAMES[start.getMonth()];
  const startDay = start.getDate();
  const endMonth = MONTH_NAMES[end.getMonth()];
  const endDay = end.getDate();

  if (startISO === endISO) {
    return `${startMonth} ${startDay}`;
  }

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${startDay}\u2013${endDay}`;
  }

  return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}`;
}
