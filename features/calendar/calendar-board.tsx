'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  generateIcsContent,
  parseIcsContent,
  type ParsedIcsEvent,
} from '@/lib/format/ics';
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type {
  CalendarAdminEvent,
  CalendarAdminEventType,
  SessionRecord,
} from '@/types/pedagogy';
import {
  addDaysISO,
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  detectCalendarConflicts,
  formatDayHeader,
  formatPeriodHeading,
  getAdminEventToneClasses,
  getMonthGridISO,
  getRangeDatesISO,
  getSubjectToneClasses,
  HOUR_HEIGHT_PX,
  minutesToTime,
  timeToMinutes,
} from './calendar-utils';

type CalendarView =
  | 'day'
  | '3days'
  | 'week'
  | 'month'
  | 'agenda'
  | 'by_room'
  | 'by_teacher';

type SelectedEvent =
  | { kind: 'session'; data: SessionRecord }
  | { kind: 'admin'; data: CalendarAdminEvent };

const TODAY_DEMO_ISO = '2026-11-26';

let calSeq = 700;
function nextCalendarId(prefix: string) {
  calSeq += 1;
  return `${prefix}-${calSeq}`;
}

export function CalendarBoard() {
  const { activeCenter, hasModule } = useDemoSession();
  const {
    sessions,
    adminEvents,
    subjects,
    groups,
    rooms,
    sites,
    addSession,
    addSessionsBatch,
    updateSession,
    deleteSession,
    addAdminEvent,
    deleteAdminEvent,
  } = usePedagogyStore();
  const { teachers } = useProfilesStore();

  const [view, setView] = useState<CalendarView>('week');
  const [anchorISO, setAnchorISO] = useState<string>(TODAY_DEMO_ISO);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [showSessions, setShowSessions] = useState(true);
  const [showAdminEvents, setShowAdminEvents] = useState(true);

  // Selected event Drawer
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<SelectedEvent | null>(null);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(
    null
  );
  const [evKind, setEvKind] = useState<'session' | CalendarAdminEventType>(
    'session'
  );
  const [fTitle, setFTitle] = useState('');
  const [fGroupId, setFGroupId] = useState('');
  const [fTeacherId, setFTeacherId] = useState('');
  const [fRoomId, setFRoomId] = useState('');
  const [fDateISO, setFDateISO] = useState(TODAY_DEMO_ISO);
  const [fStart, setFStart] = useState('17:00');
  const [fEnd, setFEnd] = useState('18:30');
  const [fRecurrence, setFRecurrence] = useState<'none' | 'weekly'>('none');
  const [fRepeatWeeks, setFRepeatWeeks] = useState('4');
  const [fScope, setFScope] = useState<'single' | 'future'>('single');
  const [fNotes, setFNotes] = useState('');

  // Conflict modal (for form save OR drag-drop move)
  const [conflictState, setConflictState] = useState<{
    issues: string[];
    onShift: () => void;
    onChangeRoom: (newRoomId: string) => void;
    onForce: () => void;
  } | null>(null);

  // Dragged session ID
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);

  // ICS Import & Sync modal
  const icsInputRef = useRef<HTMLInputElement | null>(null);
  const [icsImportOpen, setIcsImportOpen] = useState(false);
  const [parsedIcs, setParsedIcs] = useState<ParsedIcsEvent[]>([]);
  const [selectedIcsIndices, setSelectedIcsIndices] = useState<number[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  const subjectColorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subjects) m.set(s.id, s.color);
    return m;
  }, [subjects]);

  const filteredSessions = useMemo(() => {
    if (!showSessions) return [];
    const q = searchQuery.trim().toLowerCase();
    return sessions.filter((s) => {
      if (s.status === 'annulée') return false;
      if (siteFilter !== 'all' && s.siteName !== siteFilter) return false;
      if (teacherFilter !== 'all' && s.teacherId !== teacherFilter) return false;
      if (roomFilter !== 'all' && s.roomId !== roomFilter) return false;
      if (
        q &&
        !`${s.title} ${s.groupName} ${s.teacherName} ${s.roomName}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [
    sessions,
    showSessions,
    searchQuery,
    siteFilter,
    teacherFilter,
    roomFilter,
  ]);

  const filteredAdminEvents = useMemo(() => {
    if (!showAdminEvents) return [];
    const q = searchQuery.trim().toLowerCase();
    return adminEvents.filter((ev) => {
      if (
        siteFilter !== 'all' &&
        ev.siteName !== siteFilter &&
        ev.siteName !== 'Tous les sites'
      ) {
        return false;
      }
      if (q && !`${ev.title} ${ev.siteName}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [adminEvents, showAdminEvents, searchQuery, siteFilter]);

  const stepPeriod = (dir: -1 | 1) => {
    if (view === 'day' || view === 'by_room' || view === 'by_teacher') {
      setAnchorISO((prev) => addDaysISO(prev, dir));
    } else if (view === '3days') {
      setAnchorISO((prev) => addDaysISO(prev, dir * 3));
    } else if (view === 'month') {
      setAnchorISO((prev) => addDaysISO(prev, dir * 28));
    } else {
      setAnchorISO((prev) => addDaysISO(prev, dir * 7));
    }
  };

  const openCreateAtSlot = (
    dateISO: string,
    startTime = '17:00',
    defaultRoomId?: string,
    defaultTeacherId?: string
  ) => {
    const grp = groups[0];
    const startMin = timeToMinutes(startTime);
    setEditingSession(null);
    setEvKind('session');
    setFTitle(grp ? `${grp.subjectName} — ${grp.name}` : 'Séance de soutien');
    setFGroupId(grp?.id ?? '');
    setFTeacherId(defaultTeacherId ?? grp?.teacherId ?? teachers[0]?.id ?? '');
    setFRoomId(defaultRoomId ?? grp?.roomId ?? rooms[0]?.id ?? '');
    setFDateISO(dateISO);
    setFStart(startTime);
    setFEnd(minutesToTime(startMin + 90));
    setFRecurrence('none');
    setFRepeatWeeks('4');
    setFScope('single');
    setFNotes('');
    setModalOpen(true);
  };

  const openEditSession = (ses: SessionRecord) => {
    setEditingSession(ses);
    setEvKind('session');
    setFTitle(ses.title);
    setFGroupId(ses.groupId);
    setFTeacherId(ses.teacherId);
    setFRoomId(ses.roomId);
    setFDateISO(ses.dateISO);
    setFStart(ses.startTime);
    setFEnd(ses.endTime);
    setFRecurrence('none');
    setFScope('single');
    setFNotes(ses.notes);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const commitModalSave = (override?: {
    startTime?: string;
    endTime?: string;
    roomId?: string;
  }) => {
    const finalStart = override?.startTime ?? fStart;
    const finalEnd = override?.endTime ?? fEnd;
    const finalRoomId = override?.roomId ?? fRoomId;

    if (evKind !== 'session') {
      addAdminEvent({
        id: nextCalendarId('cal-adm'),
        centerId: activeCenter.id,
        title: fTitle.trim() || 'Événement centre',
        eventType: evKind,
        siteName:
          siteFilter !== 'all'
            ? siteFilter
            : sites[0]?.name ?? activeCenter.city,
        dateISO: fDateISO,
        startTime: finalStart,
        endTime: finalEnd,
        notes: fNotes.trim(),
      });
      toast.success('Événement ajouté au calendrier (Mode Démo)');
      setModalOpen(false);
      setConflictState(null);
      return;
    }

    const grp = groups.find((g) => g.id === fGroupId);
    const tea = teachers.find((t) => t.id === fTeacherId);
    const rm = rooms.find((r) => r.id === finalRoomId);
    const durationMinutes = Math.max(
      30,
      timeToMinutes(finalEnd) - timeToMinutes(finalStart)
    );

    const basePayload = {
      title: fTitle.trim() || 'Séance planifiée',
      subjectId: grp?.subjectId ?? '',
      subjectName: grp?.subjectName ?? 'Soutien',
      groupId: grp?.id ?? fGroupId,
      groupName: grp?.name ?? 'Groupe',
      teacherId: tea?.id ?? fTeacherId,
      teacherName: tea?.fullName ?? 'Professeur',
      siteId: rm?.siteId ?? grp?.siteId ?? '',
      siteName: rm?.siteName ?? grp?.siteName ?? activeCenter.city,
      roomId: rm?.id ?? finalRoomId,
      roomName: rm?.name ?? 'Salle',
      dateISO: fDateISO,
      dateLabel: fDateISO === TODAY_DEMO_ISO ? "Aujourd'hui" : fDateISO,
      startTime: finalStart,
      endTime: finalEnd,
      durationMinutes,
      capacity: rm?.capacity ?? grp?.capacity ?? 20,
      expectedStudents: grp?.enrolledCount ?? 16,
      notes: fNotes.trim(),
    };

    if (editingSession) {
      updateSession(editingSession.id, basePayload, fScope);
      toast.success(
        fScope === 'future' && editingSession.recurrenceId
          ? 'Série future mise à jour'
          : 'Séance mise à jour'
      );
    } else if (fRecurrence === 'weekly') {
      const count = Math.max(1, Math.min(12, Number(fRepeatWeeks) || 4));
      const recId = nextCalendarId('rec');
      const batch: SessionRecord[] = Array.from({ length: count }, (_, idx) => {
        const iso = addDaysISO(fDateISO, idx * 7);
        return {
          id: nextCalendarId('ses'),
          centerId: activeCenter.id,
          presentStudents: 0,
          status: 'planifiée',
          recurrenceId: recId,
          resourceIds: [],
          ...basePayload,
          dateISO: iso,
          dateLabel: iso === TODAY_DEMO_ISO ? "Aujourd'hui" : iso,
        };
      });
      addSessionsBatch(batch);
      toast.success(`${count} séances récurrentes planifiées`);
    } else {
      addSession({
        id: nextCalendarId('ses'),
        centerId: activeCenter.id,
        presentStudents: 0,
        status: 'planifiée',
        resourceIds: [],
        ...basePayload,
      });
      toast.success('Séance ajoutée au calendrier');
    }

    setModalOpen(false);
    setConflictState(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (evKind === 'session') {
      const issues = detectCalendarConflicts({
        candidateDateISO: fDateISO,
        candidateStart: fStart,
        candidateEnd: fEnd,
        roomId: fRoomId,
        teacherId: fTeacherId,
        excludeSessionId: editingSession?.id,
        sessions,
        adminEvents,
      });
      if (issues.length > 0) {
        setConflictState({
          issues,
          onShift: () => {
            const shiftedStart = minutesToTime(timeToMinutes(fStart) + 90);
            const shiftedEnd = minutesToTime(timeToMinutes(fEnd) + 90);
            setFStart(shiftedStart);
            setFEnd(shiftedEnd);
            commitModalSave({ startTime: shiftedStart, endTime: shiftedEnd });
          },
          onChangeRoom: (newRoomId) => {
            setFRoomId(newRoomId);
            commitModalSave({ roomId: newRoomId });
          },
          onForce: () => commitModalSave(),
        });
        return;
      }
    }
    commitModalSave();
  };

  const handleDropOnSlot = (
    targetDateISO: string,
    targetHour: number,
    overrideRoomId?: string,
    overrideTeacherId?: string
  ) => {
    if (!draggedSessionId) return;
    const ses = sessions.find((s) => s.id === draggedSessionId);
    setDraggedSessionId(null);
    if (!ses) return;

    const newStart = `${String(targetHour).padStart(2, '0')}:00`;
    const newEnd = minutesToTime(targetHour * 60 + ses.durationMinutes);
    const nextRoomId = overrideRoomId ?? ses.roomId;
    const nextTeacherId = overrideTeacherId ?? ses.teacherId;

    const issues = detectCalendarConflicts({
      candidateDateISO: targetDateISO,
      candidateStart: newStart,
      candidateEnd: newEnd,
      roomId: nextRoomId,
      teacherId: nextTeacherId,
      excludeSessionId: ses.id,
      sessions,
      adminEvents,
    });

    const applyMove = (roomOverride?: string) => {
      const rm = rooms.find((r) => r.id === (roomOverride ?? nextRoomId));
      const tea = teachers.find((t) => t.id === nextTeacherId);
      updateSession(ses.id, {
        dateISO: targetDateISO,
        dateLabel: targetDateISO === TODAY_DEMO_ISO ? "Aujourd'hui" : targetDateISO,
        startTime: newStart,
        endTime: newEnd,
        roomId: rm?.id ?? nextRoomId,
        roomName: rm?.name ?? ses.roomName,
        siteId: rm?.siteId ?? ses.siteId,
        siteName: rm?.siteName ?? ses.siteName,
        teacherId: tea?.id ?? nextTeacherId,
        teacherName: tea?.fullName ?? ses.teacherName,
      });
      toast.success(`Séance déplacée vers ${targetDateISO} à ${newStart}`);
    };

    if (issues.length > 0) {
      setConflictState({
        issues,
        onShift: () => {
          const altStart = minutesToTime(targetHour * 60 + 90);
          const altEnd = minutesToTime(targetHour * 60 + 90 + ses.durationMinutes);
          updateSession(ses.id, {
            dateISO: targetDateISO,
            dateLabel: targetDateISO === TODAY_DEMO_ISO ? "Aujourd'hui" : targetDateISO,
            startTime: altStart,
            endTime: altEnd,
          });
          toast.success(`Séance décalée à ${altStart} (${targetDateISO})`);
          setConflictState(null);
        },
        onChangeRoom: (newRoomId) => {
          applyMove(newRoomId);
          setConflictState(null);
        },
        onForce: () => {
          applyMove();
          setConflictState(null);
        },
      });
      return;
    }

    applyMove();
  };

  const handleExportIcs = () => {
    if (!hasModule('calendar.ics') && !hasModule('calendar.internal')) {
      toast.error('Export ICS non activé pour ce centre.');
      return;
    }
    const eventsToExport = [
      ...filteredSessions.map((s) => ({
        uid: s.id,
        title: `${s.title} (${s.groupName})`,
        dateISO: s.dateISO,
        startTime: s.startTime,
        endTime: s.endTime,
        location: `${s.roomName}, ${s.siteName}`,
        description: `Professeur : ${s.teacherName}`,
      })),
      ...filteredAdminEvents.map((e) => ({
        uid: e.id,
        title: e.title,
        dateISO: e.dateISO,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.siteName,
        description: e.notes,
      })),
    ];
    const icsText = generateIcsContent(
      eventsToExport,
      `MarkazFlow — ${activeCenter.name}`,
      activeCenter.timezone
    );
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendrier-${activeCenter.branding.shortCode.toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${eventsToExport.length} événement(s) exporté(s) en .ics`);
  };

  const handleIcsFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const existingKeys = new Set(
      sessions.map((s) => `${s.dateISO}|${s.startTime}|${s.title.toLowerCase()}`)
    );
    const parsed = parseIcsContent(text, existingKeys);
    setParsedIcs(parsed);
    setSelectedIcsIndices(
      parsed.map((p, idx) => (p.isDuplicate ? -1 : idx)).filter((i) => i >= 0)
    );
  };

  const loadSampleIcs = () => {
    const sample = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:ext-demo-1',
      'DTSTART:20261127T150000',
      'DTEND:20261127T163000',
      'SUMMARY:Atelier Orientation Post-Bac',
      'LOCATION:Centre Guéliz',
      'DESCRIPTION:Importé depuis fichier .ics externe',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    const existingKeys = new Set(
      sessions.map((s) => `${s.dateISO}|${s.startTime}|${s.title.toLowerCase()}`)
    );
    const parsed = parseIcsContent(sample, existingKeys);
    setParsedIcs(parsed);
    setSelectedIcsIndices(
      parsed.map((p, idx) => (p.isDuplicate ? -1 : idx)).filter((i) => i >= 0)
    );
  };

  const hours = useMemo(
    () =>
      Array.from(
        { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
        (_, i) => CALENDAR_START_HOUR + i
      ),
    []
  );

  const timeGridDates = useMemo(() => {
    if (view === 'day' || view === '3days' || view === 'week') {
      return getRangeDatesISO(anchorISO, view);
    }
    return [anchorISO];
  }, [anchorISO, view]);

  const monthData = useMemo(() => getMonthGridISO(anchorISO), [anchorISO]);

  const agendaDates = useMemo(() => {
    const set = new Set<string>();
    filteredSessions.forEach((s) => set.add(s.dateISO));
    filteredAdminEvents.forEach((e) => set.add(e.dateISO));
    return Array.from(set).sort();
  }, [filteredSessions, filteredAdminEvents]);

  return (
    <div className="space-y-4">
      {/* Header & Primary Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Calendrier interne
          </h1>
          <p className="text-xs text-muted-foreground">
            {activeCenter.name} · Fuseau {activeCenter.timezone} · Glisser-déposer
            ou cliquer un créneau libre
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSyncModalOpen(true)}
          >
            <ExternalLink className="size-3.5" />
            Apple / Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setParsedIcs([]);
              setIcsImportOpen(true);
            }}
          >
            <Upload className="size-3.5" />
            Importer .ics
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportIcs}
          >
            <Download className="size-3.5" />
            Exporter .ics
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => openCreateAtSlot(anchorISO, '17:00')}
          >
            <Plus className="size-4" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* Navigation & View Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setAnchorISO(TODAY_DEMO_ISO)}
          >
            Aujourd&apos;hui
          </Button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Période précédente"
              onClick={() => stepPeriod(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Période suivante"
              onClick={() => stepPeriod(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <span className="min-w-32 text-sm font-semibold">
            {formatPeriodHeading(anchorISO)}
          </span>
        </div>

        {/* Segmented view bar */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
          {(
            [
              ['day', 'Jour'],
              ['3days', '3 jours'],
              ['week', 'Semaine'],
              ['month', 'Mois'],
              ['agenda', 'Agenda'],
              ['by_room', 'Par salle'],
              ['by_teacher', 'Par prof'],
            ] as [CalendarView, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                view === id
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Layers Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer séance, prof, salle..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select
            value={siteFilter}
            onValueChange={(v) => setSiteFilter(v ?? 'all')}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={teacherFilter}
            onValueChange={(v) => setTeacherFilter(v ?? 'all')}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Professeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les professeurs</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={roomFilter}
            onValueChange={(v) => setRoomFilter(v ?? 'all')}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Salle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les salles</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showSessions}
              onChange={(e) => setShowSessions(e.target.checked)}
            />
            Séances de cours
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showAdminEvents}
              onChange={(e) => setShowAdminEvents(e.target.checked)}
            />
            Admin, absences & fériés
          </label>
        </div>
      </div>

      {/* Main Calendar Viewport */}
      {view === 'day' || view === '3days' || view === 'week' ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <div className="min-w-[760px]">
            {/* Columns header */}
            <div className="grid grid-cols-[64px_1fr] border-b border-border">
              <div className="flex items-center justify-center border-r border-border p-2 text-[11px] font-medium text-muted-foreground">
                GMT+1
              </div>
              <div
                className="grid divide-x divide-border"
                style={{
                  gridTemplateColumns: `repeat(${timeGridDates.length}, minmax(0, 1fr))`,
                }}
              >
                {timeGridDates.map((iso) => {
                  const h = formatDayHeader(iso);
                  const isToday = iso === TODAY_DEMO_ISO;
                  return (
                    <div
                      key={iso}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-7 items-center justify-center rounded-md font-mono text-xs font-semibold tabular-nums ${
                            isToday
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {h.dayNum}
                        </span>
                        <div className="leading-tight">
                          <p className="text-xs font-semibold">{h.weekday}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {h.monthShort}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreateAtSlot(iso, '17:00')}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Ajouter le ${iso}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly grid */}
            <div className="grid grid-cols-[64px_1fr]">
              {/* Time labels */}
              <div className="divide-y divide-border border-r border-border">
                {hours.map((hr) => (
                  <div
                    key={hr}
                    style={{ height: `${HOUR_HEIGHT_PX}px` }}
                    className="pr-2 pt-1 text-right font-mono text-[11px] text-muted-foreground tabular-nums"
                  >
                    {String(hr).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div
                className="grid divide-x divide-border"
                style={{
                  gridTemplateColumns: `repeat(${timeGridDates.length}, minmax(0, 1fr))`,
                }}
              >
                {timeGridDates.map((iso) => {
                  const daySessions = filteredSessions.filter(
                    (s) => s.dateISO === iso
                  );
                  const dayAdmin = filteredAdminEvents.filter(
                    (e) => e.dateISO === iso
                  );

                  return (
                    <div
                      key={iso}
                      className="relative"
                      style={{
                        height: `${hours.length * HOUR_HEIGHT_PX}px`,
                      }}
                    >
                      {/* Clickable & droppable hourly slots */}
                      {hours.map((hr) => (
                        <div
                          key={hr}
                          onClick={() =>
                            openCreateAtSlot(
                              iso,
                              `${String(hr).padStart(2, '0')}:00`
                            )
                          }
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropOnSlot(iso, hr);
                          }}
                          style={{ height: `${HOUR_HEIGHT_PX}px` }}
                          className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/30"
                        />
                      ))}

                      {/* Admin / Holiday blocks */}
                      {dayAdmin.map((ev) => {
                        const startMin = Math.max(
                          CALENDAR_START_HOUR * 60,
                          timeToMinutes(ev.startTime)
                        );
                        const endMin = Math.min(
                          (CALENDAR_END_HOUR + 1) * 60,
                          timeToMinutes(ev.endTime)
                        );
                        const top =
                          ((startMin - CALENDAR_START_HOUR * 60) / 60) *
                          HOUR_HEIGHT_PX;
                        const height = Math.max(
                          28,
                          ((endMin - startMin) / 60) * HOUR_HEIGHT_PX
                        );
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent({ kind: 'admin', data: ev });
                            }}
                            style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
                            className={`absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-left text-[11px] transition-opacity hover:opacity-90 ${getAdminEventToneClasses(
                              ev.eventType
                            )}`}
                          >
                            <p className="truncate font-mono text-[10px] font-semibold tabular-nums">
                              {ev.startTime}–{ev.endTime}
                            </p>
                            <p className="truncate font-medium">{ev.title}</p>
                          </button>
                        );
                      })}

                      {/* Session blocks */}
                      {daySessions.map((ses) => {
                        const startMin = Math.max(
                          CALENDAR_START_HOUR * 60,
                          timeToMinutes(ses.startTime)
                        );
                        const endMin = Math.min(
                          (CALENDAR_END_HOUR + 1) * 60,
                          timeToMinutes(ses.endTime)
                        );
                        const top =
                          ((startMin - CALENDAR_START_HOUR * 60) / 60) *
                          HOUR_HEIGHT_PX;
                        const height = Math.max(
                          36,
                          ((endMin - startMin) / 60) * HOUR_HEIGHT_PX
                        );
                        const color = subjectColorMap.get(ses.subjectId);
                        return (
                          <div
                            key={ses.id}
                            draggable
                            onDragStart={() => setDraggedSessionId(ses.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent({ kind: 'session', data: ses });
                            }}
                            style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
                            className={`absolute inset-x-1 cursor-grab overflow-hidden rounded-md border px-2 py-1 text-left text-[11px] transition-shadow hover:shadow-sm active:cursor-grabbing ${getSubjectToneClasses(
                              color
                            )}`}
                          >
                            <p className="truncate font-mono text-[10px] font-semibold tabular-nums">
                              {ses.startTime}–{ses.endTime}
                            </p>
                            <p className="truncate font-medium">{ses.groupName}</p>
                            <p className="truncate text-[10px] opacity-80">
                              {ses.teacherName} · {ses.roomName}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : view === 'month' ? (
        <div className="rounded-lg border border-border bg-card">
          <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted-foreground">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {monthData.cells.map((cell) => {
              const daySes = filteredSessions.filter(
                (s) => s.dateISO === cell.dateISO
              );
              const dayAdm = filteredAdminEvents.filter(
                (e) => e.dateISO === cell.dateISO
              );
              const isToday = cell.dateISO === TODAY_DEMO_ISO;
              return (
                <div
                  key={cell.dateISO}
                  onClick={() => openCreateAtSlot(cell.dateISO, '17:00')}
                  className={`min-h-24 cursor-pointer p-1.5 transition-colors hover:bg-muted/30 ${
                    !cell.inMonth ? 'bg-muted/20 text-muted-foreground' : ''
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`inline-flex size-6 items-center justify-center rounded font-mono text-xs tabular-nums ${
                        isToday
                          ? 'bg-primary font-semibold text-primary-foreground'
                          : ''
                      }`}
                    >
                      {cell.dateISO.slice(-2)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {daySes.slice(0, 2).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent({ kind: 'session', data: s });
                        }}
                        className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] ${getSubjectToneClasses(
                          subjectColorMap.get(s.subjectId)
                        )}`}
                      >
                        {s.startTime} {s.groupName}
                      </button>
                    ))}
                    {dayAdm.slice(0, 1).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent({ kind: 'admin', data: ev });
                        }}
                        className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] ${getAdminEventToneClasses(
                          ev.eventType
                        )}`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {daySes.length + dayAdm.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">
                        +{daySes.length + dayAdm.length - 3} autre(s)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'agenda' ? (
        agendaDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
            <CalendarIcon className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Aucun événement pour les filtres actuels
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => {
                setSearchQuery('');
                setSiteFilter('all');
                setTeacherFilter('all');
                setRoomFilter('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {agendaDates.map((iso) => {
              const h = formatDayHeader(iso);
              const daySes = filteredSessions.filter((s) => s.dateISO === iso);
              const dayAdm = filteredAdminEvents.filter(
                (e) => e.dateISO === iso
              );
              return (
                <div
                  key={iso}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="mb-3 text-sm font-semibold">
                    {h.weekday} {h.dayNum} {h.monthShort} ·{' '}
                    <span className="font-mono text-xs text-muted-foreground">
                      {iso}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {daySes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setSelectedEvent({ kind: 'session', data: s })
                        }
                        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left text-xs hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold tabular-nums">
                            {s.startTime}–{s.endTime}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">
                              {s.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {s.teacherName} · {s.roomName} ({s.siteName})
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {s.status}
                        </span>
                      </button>
                    ))}
                    {dayAdm.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() =>
                          setSelectedEvent({ kind: 'admin', data: ev })
                        }
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs ${getAdminEventToneClasses(
                          ev.eventType
                        )}`}
                      >
                        <span>
                          <strong className="font-mono">
                            {ev.startTime}–{ev.endTime}
                          </strong>{' '}
                          · {ev.title}
                        </span>
                        <span>{ev.siteName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Par salle OR Par prof resource matrix for active day */
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <div className="min-w-[700px]">
            <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium">
              Vue ressources du {anchorISO} ({view === 'by_room' ? 'Par salle' : 'Par professeur'})
            </div>
            <div className="divide-y divide-border">
              {(view === 'by_room' ? rooms : teachers).map((resource) => {
                const isRoom = view === 'by_room';
                const items = filteredSessions.filter((s) =>
                  isRoom
                    ? s.roomId === resource.id && s.dateISO === anchorISO
                    : s.teacherId === resource.id && s.dateISO === anchorISO
                );
                const label = isRoom
                  ? (resource as (typeof rooms)[number]).name
                  : (resource as (typeof teachers)[number]).fullName;
                const sub = isRoom
                  ? (resource as (typeof rooms)[number]).siteName
                  : (resource as (typeof teachers)[number]).subjects.join(', ');

                return (
                  <div
                    key={resource.id}
                    className="grid grid-cols-[200px_1fr] items-center gap-4 p-3"
                  >
                    <div>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{sub}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {items.length === 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            openCreateAtSlot(
                              anchorISO,
                              '17:00',
                              isRoom ? resource.id : undefined,
                              !isRoom ? resource.id : undefined
                            )
                          }
                          className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                        >
                          + Planifier un créneau libre
                        </button>
                      ) : (
                        items.map((ses) => (
                          <button
                            key={ses.id}
                            type="button"
                            onClick={() =>
                              setSelectedEvent({ kind: 'session', data: ses })
                            }
                            className={`rounded-md border px-3 py-1.5 text-left text-xs ${getSubjectToneClasses(
                              subjectColorMap.get(ses.subjectId)
                            )}`}
                          >
                            <span className="font-mono font-semibold tabular-nums">
                              {ses.startTime}–{ses.endTime}
                            </span>{' '}
                            · {ses.groupName}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Drawer */}
      <Sheet
        open={Boolean(selectedEvent)}
        onOpenChange={(o) => {
          if (!o) setSelectedEvent(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md">
          {selectedEvent?.kind === 'session' ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedEvent.data.title}</SheetTitle>
                <SheetDescription>
                  {selectedEvent.data.groupName} · {selectedEvent.data.dateISO} (
                  {selectedEvent.data.startTime}–{selectedEvent.data.endTime})
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-xs">
                <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                  <p>
                    Professeur : <strong>{selectedEvent.data.teacherName}</strong>
                  </p>
                  <p>
                    Salle : <strong>{selectedEvent.data.roomName}</strong> (
                    {selectedEvent.data.siteName})
                  </p>
                  <p>
                    Effectif attendu :{' '}
                    <strong className="font-mono tabular-nums">
                      {selectedEvent.data.expectedStudents}/
                      {selectedEvent.data.capacity}
                    </strong>
                  </p>
                  {selectedEvent.data.recurrenceId && (
                    <p className="text-muted-foreground">
                      Fait partie d&apos;une série récurrente ({selectedEvent.data.recurrenceId})
                    </p>
                  )}
                  {selectedEvent.data.notes && (
                    <p className="text-muted-foreground">
                      Notes : {selectedEvent.data.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openEditSession(selectedEvent.data)}
                  >
                    Modifier / déplacer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nextISO = addDaysISO(selectedEvent.data.dateISO, 7);
                      addSession({
                        ...selectedEvent.data,
                        id: nextCalendarId('ses'),
                        dateISO: nextISO,
                        dateLabel: nextISO,
                        status: 'planifiée',
                        presentStudents: 0,
                      });
                      toast.success(`Séance dupliquée au ${nextISO}`);
                      setSelectedEvent(null);
                    }}
                  >
                    <Copy className="size-3.5" />
                    Dupliquer (+7j)
                  </Button>
                  <Link
                    href="/admin/attendance"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                  >
                    <CheckSquare className="size-3.5" />
                    Feuille d&apos;appel
                  </Link>
                </div>

                <div className="border-t border-border pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteConfirm(selectedEvent)}
                  >
                    <Trash2 className="size-3.5" />
                    Supprimer cette séance
                  </Button>
                </div>
              </div>
            </>
          ) : selectedEvent?.kind === 'admin' ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedEvent.data.title}</SheetTitle>
                <SheetDescription>
                  {selectedEvent.data.dateISO} · {selectedEvent.data.startTime}–
                  {selectedEvent.data.endTime} · {selectedEvent.data.siteName}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-xs">
                <p className="rounded-lg border border-border bg-muted/40 p-3">
                  {selectedEvent.data.notes || 'Aucune note complémentaire.'}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteConfirm(selectedEvent)}
                >
                  <Trash2 className="size-3.5" />
                  Supprimer l&apos;événement
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Event Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Modifier la séance' : 'Planifier un événement'}
            </DialogTitle>
            <DialogDescription>
              Vérification des conflits salle, professeur et jours fermés en Mode Démo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveForm} className="space-y-4">
            {!editingSession && (
              <FormFieldWrapper id="cal-kind" label="Type d'événement">
                <Select
                  value={evKind}
                  onValueChange={(v) =>
                    setEvKind(
                      (v as 'session' | CalendarAdminEventType) ?? 'session'
                    )
                  }
                >
                  <SelectTrigger id="cal-kind" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Séance de cours</SelectItem>
                    <SelectItem value="administratif">
                      Événement administratif / réunion
                    </SelectItem>
                    <SelectItem value="absence_prof">
                      Absence / indisponibilité professeur
                    </SelectItem>
                    <SelectItem value="ferie">Jour férié / centre fermé</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            )}

            <FormFieldWrapper id="cal-title" label="Titre" required>
              <Input
                id="cal-title"
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
              />
            </FormFieldWrapper>

            {evKind === 'session' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormFieldWrapper id="cal-grp" label="Groupe">
                    <Select
                      value={fGroupId}
                      onValueChange={(v) => setFGroupId(v ?? '')}
                    >
                      <SelectTrigger id="cal-grp" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                  <FormFieldWrapper id="cal-tea" label="Professeur">
                    <Select
                      value={fTeacherId}
                      onValueChange={(v) => setFTeacherId(v ?? '')}
                    >
                      <SelectTrigger id="cal-tea" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                </div>

                <FormFieldWrapper id="cal-room" label="Salle">
                  <Select
                    value={fRoomId}
                    onValueChange={(v) => setFRoomId(v ?? '')}
                  >
                    <SelectTrigger id="cal-room" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} · {r.siteName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <FormFieldWrapper id="cal-date" label="Date">
                <Input
                  id="cal-date"
                  type="date"
                  value={fDateISO}
                  onChange={(e) => setFDateISO(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="cal-start" label="Début">
                <Input
                  id="cal-start"
                  type="time"
                  value={fStart}
                  onChange={(e) => setFStart(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="cal-end" label="Fin">
                <Input
                  id="cal-end"
                  type="time"
                  value={fEnd}
                  onChange={(e) => setFEnd(e.target.value)}
                />
              </FormFieldWrapper>
            </div>

            {!editingSession && evKind === 'session' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormFieldWrapper id="cal-rec" label="Répétition">
                  <Select
                    value={fRecurrence}
                    onValueChange={(v) =>
                      setFRecurrence((v as 'none' | 'weekly') ?? 'none')
                    }
                  >
                    <SelectTrigger id="cal-rec" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Séance unique</SelectItem>
                      <SelectItem value="weekly">Chaque semaine</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
                {fRecurrence === 'weekly' && (
                  <FormFieldWrapper id="cal-weeks" label="Occurrences">
                    <Input
                      id="cal-weeks"
                      type="number"
                      min={2}
                      max={12}
                      value={fRepeatWeeks}
                      onChange={(e) => setFRepeatWeeks(e.target.value)}
                    />
                  </FormFieldWrapper>
                )}
              </div>
            )}

            {editingSession?.recurrenceId && (
              <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                <p className="font-medium">Modifier :</p>
                <div className="flex flex-wrap gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="cal-scope"
                      checked={fScope === 'single'}
                      onChange={() => setFScope('single')}
                    />
                    Cette occurrence uniquement
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="cal-scope"
                      checked={fScope === 'future'}
                      onChange={() => setFScope('future')}
                    />
                    Toutes les occurrences futures
                  </label>
                </div>
              </div>
            )}

            <FormFieldWrapper id="cal-notes" label="Notes">
              <Textarea
                id="cal-notes"
                rows={2}
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
              />
            </FormFieldWrapper>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingSession ? 'Enregistrer' : 'Ajouter au calendrier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Conflict Arbitration Dialog */}
      <Dialog
        open={Boolean(conflictState)}
        onOpenChange={(o) => {
          if (!o) setConflictState(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              Conflit détecté
            </DialogTitle>
            <DialogDescription>
              Une collision empêche l&apos;enregistrement direct sur ce créneau.
            </DialogDescription>
          </DialogHeader>
          {conflictState && (
            <div className="space-y-4 text-xs">
              <ul className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-3">
                {conflictState.issues.map((msg, i) => (
                  <li key={i}>• {msg}</li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={conflictState.onShift}
                >
                  <Clock className="size-3.5" />
                  Décaler l&apos;horaire (+1h30)
                </Button>
                {rooms[0] && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const altRoom =
                        rooms.find((r) => r.id !== fRoomId) ?? rooms[0];
                      conflictState.onChangeRoom(altRoom.id);
                    }}
                  >
                    Basculer vers une autre salle
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={conflictState.onForce}
                >
                  Maintenir malgré le conflit (démo)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConflictState(null)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import .ics Preview Dialog */}
      <Dialog open={icsImportOpen} onOpenChange={setIcsImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importer un calendrier .ics (local)</DialogTitle>
            <DialogDescription>
              Lecture locale sans serveur, détection de doublons et aperçu avant ajout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={icsInputRef}
                type="file"
                accept=".ics,text/calendar"
                className="hidden"
                onChange={handleIcsFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => icsInputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                Choisir un fichier .ics
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadSampleIcs}
              >
                Charger un exemple .ics
              </Button>
            </div>

            {parsedIcs.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="font-semibold">
                  {parsedIcs.length} événement(s) détecté(s) :
                </p>
                {parsedIcs.map((ev, idx) => (
                  <label
                    key={`${ev.uid}-${idx}`}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded border border-border px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIcsIndices.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIcsIndices((p) => [...p, idx]);
                          } else {
                            setSelectedIcsIndices((p) =>
                              p.filter((i) => i !== idx)
                            );
                          }
                        }}
                      />
                      <div>
                        <p className="font-medium">{ev.title}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {ev.dateISO} · {ev.startTime}–{ev.endTime} · {ev.location}
                        </p>
                      </div>
                    </div>
                    {ev.isDuplicate && (
                      <span className="text-[11px] font-medium text-warning">
                        Doublon potentiel
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIcsImportOpen(false)}
              >
                Fermer
              </Button>
              <Button
                type="button"
                disabled={selectedIcsIndices.length === 0}
                onClick={() => {
                  const chosen = selectedIcsIndices
                    .map((i) => parsedIcs[i])
                    .filter(Boolean);
                  chosen.forEach((ev) => {
                    addAdminEvent({
                      id: nextCalendarId('cal-ics'),
                      centerId: activeCenter.id,
                      title: ev.title,
                      eventType: 'administratif',
                      siteName: ev.location,
                      dateISO: ev.dateISO,
                      startTime: ev.startTime,
                      endTime: ev.endTime,
                      notes: ev.description || 'Importé depuis fichier .ics local',
                    });
                  });
                  toast.success(
                    `${chosen.length} événement(s) importé(s) dans le calendrier démo`
                  );
                  setIcsImportOpen(false);
                }}
              >
                Importer la sélection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apple / Google Calendar Integration Status Modal */}
      <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Intégrations Apple & Google Calendar</DialogTitle>
            <DialogDescription>
              État des connecteurs externes en Mode Démo (aucun secret ou OAuth réel).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Google Calendar (OAuth 2.0)</span>
                <span className="font-medium text-muted-foreground">
                  Non connecté
                </span>
              </div>
              <p className="text-muted-foreground">
                La synchronisation bidirectionnelle Google Calendar nécessite un
                flux OAuth serveur et le stockage sécurisé des jetons. Désactivée
                en prototype frontend.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Apple Calendar (Flux ICS)</span>
                <span className="font-medium text-primary">Export .ics prêt</span>
              </div>
              <p className="text-muted-foreground">
                Apple Calendar ne propose pas d&apos;OAuth standard équivalent à
                Google : utilisez l&apos;export ponctuel <strong>.ics</strong> ou,
                en production, un lien d&apos;abonnement ICS privé signé et
                révocable généré par le backend (aucun secret exposé côté navigateur).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button type="button" size="xs" onClick={handleExportIcs}>
                  <Download className="size-3" />
                  Télécharger le fichier .ics
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    toast.info(
                      'En production : le backend génère un lien webcal:// signé et révocable.'
                    );
                  }}
                >
                  Aperçu abonnement Mac / iPhone
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(o) => {
          if (!o) setDeleteConfirm(null);
        }}
        variant="destructive"
        title="Supprimer cet événement du calendrier ?"
        description="Cette suppression retire l'événement de la session locale de démonstration."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.kind === 'session') {
            deleteSession(deleteConfirm.data.id);
          } else {
            deleteAdminEvent(deleteConfirm.data.id);
          }
          toast.success('Événement supprimé');
          setDeleteConfirm(null);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
