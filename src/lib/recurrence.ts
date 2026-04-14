import { addDays, fromIsoDate, getStartOfWeek, toIsoDate, weekdayIndexToLabel } from '@/lib/date';
import { MonthlyRecurrenceMode, RecurrenceType } from '@/types/ride';

const DAY_MS = 24 * 60 * 60 * 1000;

type RecurrenceRule = {
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceDays: number[];
  recurrenceMonthlyMode: MonthlyRecurrenceMode | null;
  recurrenceAnchorDate: string;
  recurrenceEndDate?: string | null;
};

function toWeekdayIndex(date: Date) {
  return date.getDay() === 0 ? 7 : date.getDay();
}

function uniqueSortedDays(days: number[]) {
  return [...new Set(days)].sort((left, right) => left - right);
}

function getOrdinalLabel(value: number) {
  switch (value) {
    case 1:
      return 'first';
    case 2:
      return 'second';
    case 3:
      return 'third';
    case 4:
      return 'fourth';
    case 5:
      return 'fifth';
    default:
      return `${value}th`;
  }
}

function getMonthDayOrdinal(day: number) {
  const remainder10 = day % 10;
  const remainder100 = day % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return `${day}st`;
  }

  if (remainder10 === 2 && remainder100 !== 12) {
    return `${day}nd`;
  }

  if (remainder10 === 3 && remainder100 !== 13) {
    return `${day}rd`;
  }

  return `${day}th`;
}

function getMonthWeekOrdinal(date: Date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

export function getDefaultRecurrenceDays(anchorDateIso: string) {
  return [toWeekdayIndex(fromIsoDate(anchorDateIso))];
}

export function normalizeRecurrenceDays(days: number[]) {
  return uniqueSortedDays(days).filter((day) => day >= 1 && day <= 7);
}

export function getRecurrenceDaysLabel(days: number[]) {
  const normalizedDays = normalizeRecurrenceDays(days);

  if (normalizedDays.length === 0) {
    return '';
  }

  const labels = normalizedDays.map((day) => weekdayIndexToLabel(day));

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`;
}

export function buildRecurrenceSummary(rule: RecurrenceRule) {
  if (rule.recurrenceType === 'none') {
    return 'One-time ride.';
  }

  if (rule.recurrenceType === 'weekly') {
    const dayLabel = getRecurrenceDaysLabel(rule.recurrenceDays);
    const intervalLabel =
      rule.recurrenceInterval === 2 ? 'every 2 weeks' : 'weekly';

    return dayLabel
      ? `Repeats ${intervalLabel} on ${dayLabel}.`
      : `Repeats ${intervalLabel}.`;
  }

  const anchorDate = fromIsoDate(rule.recurrenceAnchorDate);

  if (rule.recurrenceMonthlyMode === 'nth_weekday') {
    const ordinal = getOrdinalLabel(getMonthWeekOrdinal(anchorDate));
    return `Repeats monthly on the ${ordinal} ${weekdayIndexToLabel(
      toWeekdayIndex(anchorDate)
    )}.`;
  }

  return `Repeats monthly on the ${getMonthDayOrdinal(anchorDate.getDate())}.`;
}

export function matchesRecurringRule(dateIso: string, rule: RecurrenceRule) {
  if (rule.recurrenceType === 'none' || dateIso < rule.recurrenceAnchorDate) {
    return false;
  }

  if (rule.recurrenceEndDate && dateIso > rule.recurrenceEndDate) {
    return false;
  }

  const candidateDate = fromIsoDate(dateIso);
  const anchorDate = fromIsoDate(rule.recurrenceAnchorDate);

  if (rule.recurrenceType === 'weekly') {
    const allowedDays = new Set(normalizeRecurrenceDays(rule.recurrenceDays));

    if (!allowedDays.has(toWeekdayIndex(candidateDate))) {
      return false;
    }

    const candidateWeekStart = getStartOfWeek(candidateDate);
    const anchorWeekStart = getStartOfWeek(anchorDate);
    const weekOffset = Math.round(
      (candidateWeekStart.getTime() - anchorWeekStart.getTime()) / DAY_MS / 7
    );

    return weekOffset >= 0 && weekOffset % Math.max(rule.recurrenceInterval, 1) === 0;
  }

  if (rule.recurrenceMonthlyMode === 'nth_weekday') {
    return (
      candidateDate.getDay() === anchorDate.getDay() &&
      getMonthWeekOrdinal(candidateDate) === getMonthWeekOrdinal(anchorDate)
    );
  }

  return candidateDate.getDate() === anchorDate.getDate();
}

export function getRecurringDatesForWindow(
  rule: RecurrenceRule,
  startIso: string,
  windowDays: number
) {
  const startDate = fromIsoDate(startIso);
  const dates: string[] = [];

  for (let offset = 0; offset < windowDays; offset += 1) {
    const next = addDays(startDate, offset);
    const isoDate = toIsoDate(next);

    if (matchesRecurringRule(isoDate, rule)) {
      dates.push(isoDate);
    }
  }

  return dates;
}
