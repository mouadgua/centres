export interface IcsExportEvent {
  uid: string;
  title: string;
  dateISO: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  description?: string;
}

export interface ParsedIcsEvent {
  uid: string;
  title: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  isDuplicate: boolean;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDateTime(dateISO: string, timeHHmm: string): string {
  const d = dateISO.replace(/-/g, '');
  const t = timeHHmm.replace(/:/g, '').padEnd(4, '0') + '00';
  return `${d}T${t}`;
}

export function generateIcsContent(
  events: IcsExportEvent[],
  calendarName = 'MarkazFlow — Emploi du temps',
  timezone = 'Africa/Casablanca'
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MarkazFlow//Frontend Prototype//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    `X-WR-TIMEZONE:${timezone}`,
  ];

  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.uid}@markazflow.demo`);
    lines.push(`DTSTAMP:20261126T090000Z`);
    lines.push(`DTSTART;TZID=${timezone}:${toIcsDateTime(ev.dateISO, ev.startTime)}`);
    lines.push(`DTEND;TZID=${timezone}:${toIcsDateTime(ev.dateISO, ev.endTime)}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.location) {
      lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    }
    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function parseIcsContent(
  rawText: string,
  existingKeys: Set<string>
): ParsedIcsEvent[] {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const blocks = normalized.split('BEGIN:VEVENT').slice(1);
  const results: ParsedIcsEvent[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i].split('END:VEVENT')[0] ?? '';
    const getField = (prefix: string) => {
      const line = block
        .split('\n')
        .find((l) => l.startsWith(`${prefix}:`) || l.startsWith(`${prefix};`));
      if (!line) return '';
      const idx = line.indexOf(':');
      return idx >= 0 ? line.slice(idx + 1).trim() : '';
    };

    const rawStart = getField('DTSTART');
    const rawEnd = getField('DTEND');
    const summary = getField('SUMMARY') || `Événement importé #${i + 1}`;
    const uid = getField('UID') || `ics-import-${i + 1}`;
    const location = getField('LOCATION') || 'Salle à affecter';
    const description = getField('DESCRIPTION') || '';

    const matchStart = rawStart.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
    const matchEnd = rawEnd.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);

    const dateISO = matchStart
      ? `${matchStart[1]}-${matchStart[2]}-${matchStart[3]}`
      : '2026-11-26';
    const startTime =
      matchStart && matchStart[4] && matchStart[5]
        ? `${matchStart[4]}:${matchStart[5]}`
        : '17:00';
    const endTime =
      matchEnd && matchEnd[4] && matchEnd[5]
        ? `${matchEnd[4]}:${matchEnd[5]}`
        : '18:30';

    const dedupKey = `${dateISO}|${startTime}|${summary.toLowerCase()}`;
    results.push({
      uid,
      title: summary.replace(/\\n/g, ' ').replace(/\\,/g, ','),
      dateISO,
      startTime,
      endTime,
      location: location.replace(/\\,/g, ','),
      description: description.replace(/\\n/g, ' '),
      isDuplicate: existingKeys.has(dedupKey),
    });
  }

  return results;
}
