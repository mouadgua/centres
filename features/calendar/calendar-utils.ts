import type { CalendarAdminEvent, SessionRecord } from '@/types/pedagogy';

export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 21;
export const HOUR_HEIGHT_PX = 56;

const FR_DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FR_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(iso: string, delta: number): string {
  const dt = parseISODate(iso);
  dt.setDate(dt.getDate() + delta);
  return formatISODate(dt);
}

export function getMondayOfWeekISO(iso: string): string {
  const dt = parseISODate(iso);
  const day = dt.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return formatISODate(dt);
}

export function getRangeDatesISO(
  anchorISO: string,
  view: 'day' | '3days' | 'week'
): string[] {
  if (view === 'day') return [anchorISO];
  if (view === '3days') {
    return [anchorISO, addDaysISO(anchorISO, 1), addDaysISO(anchorISO, 2)];
  }
  const monday = getMondayOfWeekISO(anchorISO);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
}

export function getMonthGridISO(anchorISO: string): {
  monthLabel: string;
  cells: { dateISO: string; inMonth: boolean }[];
} {
  const dt = parseISODate(anchorISO);
  const year = dt.getFullYear();
  const month = dt.getMonth();
  const firstDay = new Date(year, month, 1);
  const startISO = getMondayOfWeekISO(formatISODate(firstDay));
  const cells = Array.from({ length: 35 }, (_, i) => {
    const iso = addDaysISO(startISO, i);
    const cellDate = parseISODate(iso);
    return {
      dateISO: iso,
      inMonth: cellDate.getMonth() === month,
    };
  });
  return {
    monthLabel: `${FR_MONTHS[month]} ${year}`,
    cells,
  };
}

export function formatDayHeader(iso: string): {
  weekday: string;
  dayNum: string;
  monthShort: string;
} {
  const dt = parseISODate(iso);
  return {
    weekday: FR_DAYS_SHORT[dt.getDay()] ?? '',
    dayNum: String(dt.getDate()).padStart(2, '0'),
    monthShort: (FR_MONTHS[dt.getMonth()] ?? '').slice(0, 4),
  };
}

export function formatPeriodHeading(iso: string): string {
  const dt = parseISODate(iso);
  return `${FR_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMin: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMin));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function getSubjectToneClasses(colorHex?: string): string {
  switch (colorHex) {
    case '#0d9488':
      return 'bg-teal-500/12 border-teal-500/30 text-teal-950 dark:bg-teal-400/15 dark:border-teal-400/30 dark:text-teal-100';
    case '#d97706':
      return 'bg-amber-500/14 border-amber-500/30 text-amber-950 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-100';
    case '#16a34a':
      return 'bg-emerald-500/12 border-emerald-500/30 text-emerald-950 dark:bg-emerald-400/15 dark:border-emerald-400/30 dark:text-emerald-100';
    case '#be123c':
      return 'bg-rose-500/12 border-rose-500/30 text-rose-950 dark:bg-rose-400/15 dark:border-rose-400/30 dark:text-rose-100';
    default:
      return 'bg-blue-500/12 border-blue-500/30 text-blue-950 dark:bg-blue-400/15 dark:border-blue-400/30 dark:text-blue-100';
  }
}

export function getAdminEventToneClasses(
  type: CalendarAdminEvent['eventType']
): string {
  if (type === 'ferie') {
    return 'bg-rose-500/12 border-rose-500/30 text-rose-950 dark:bg-rose-400/15 dark:border-rose-400/30 dark:text-rose-100';
  }
  if (type === 'absence_prof') {
    return 'bg-amber-500/14 border-amber-500/30 text-amber-950 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-100';
  }
  return 'bg-violet-500/12 border-violet-500/30 text-violet-950 dark:bg-violet-400/15 dark:border-violet-400/30 dark:text-violet-100';
}

export function detectCalendarConflicts(params: {
  candidateDateISO: string;
  candidateStart: string;
  candidateEnd: string;
  roomId: string;
  teacherId: string;
  excludeSessionId?: string;
  sessions: SessionRecord[];
  adminEvents: CalendarAdminEvent[];
}): string[] {
  const {
    candidateDateISO,
    candidateStart,
    candidateEnd,
    roomId,
    teacherId,
    excludeSessionId,
    sessions,
    adminEvents,
  } = params;

  const issues: string[] = [];

  for (const ev of adminEvents) {
    if (ev.dateISO !== candidateDateISO) continue;
    if (
      ev.eventType === 'ferie' &&
      timesOverlap(candidateStart, candidateEnd, ev.startTime, ev.endTime)
    ) {
      issues.push(`Jour fermé configuré : « ${ev.title} »`);
    }
  }

  for (const s of sessions) {
    if (s.id === excludeSessionId || s.status === 'annulée') continue;
    if (s.dateISO !== candidateDateISO) continue;
    if (!timesOverlap(candidateStart, candidateEnd, s.startTime, s.endTime)) {
      continue;
    }
    if (roomId && s.roomId === roomId) {
      issues.push(
        `Salle « ${s.roomName} » déjà occupée par ${s.groupName} (${s.startTime}–${s.endTime})`
      );
    }
    if (teacherId && s.teacherId === teacherId) {
      issues.push(
        `Professeur ${s.teacherName} indisponible (${s.groupName} ${s.startTime}–${s.endTime})`
      );
    }
  }

  return issues;
}
