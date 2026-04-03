const DAY_MS = 24 * 60 * 60 * 1000;

const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});
const monthDayYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const fullMonthDayYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export function todayIso() {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function getStartOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setHours(0, 0, 0, 0);
  return addDays(next, diff);
}

export function getWeekRangeLabel(weekStartIso: string) {
  const weekStart = fromIsoDate(weekStartIso);
  const weekEnd = addDays(weekStart, 6);
  return `${monthDayFormatter.format(weekStart)} - ${monthDayYearFormatter.format(weekEnd)}`;
}

export function getDayLabel(isoDate: string) {
  return weekdayFormatter.format(fromIsoDate(isoDate));
}

export function getLongDateLabel(isoDate: string) {
  return longDateFormatter.format(fromIsoDate(isoDate));
}

export function getFullDateLabel(isoDate: string) {
  return fullMonthDayYearFormatter.format(fromIsoDate(isoDate));
}

export function combineDateAndTime(isoDate: string, time: string) {
  return new Date(`${isoDate}T${time}:00`);
}

export function formatTime(time: string) {
  const [hoursString, minutes] = time.split(':');
  const hours = Number(hoursString);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalized = hours % 12 || 12;
  return `${normalized}:${minutes} ${suffix}`;
}

export function getRelativeCountdown(isoDate: string, time: string, now = new Date()) {
  const target = combineDateAndTime(isoDate, time);
  const diff = target.getTime() - now.getTime();

  if (diff <= -60 * 1000) {
    return 'Started already';
  }

  if (Math.abs(diff) < 60 * 1000) {
    return 'Starting now';
  }

  const minutes = Math.round(diff / (60 * 1000));

  if (minutes < 60) {
    return `Starts in ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `Starts in ${hours}h ${remainder}m`;
}

export function compareTime(a: string, b: string) {
  return a.localeCompare(b);
}

export function getDefaultWeekdays() {
  return [1, 2, 3, 4, 5];
}

export function weekdayIndexToLabel(day: number) {
  const base = getStartOfWeek(new Date('2026-03-30T00:00:00'));
  return getDayLabel(toIsoDate(addDays(base, day - 1)));
}
