'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  Banknote,
  CheckSquare,
  Clock,
  Copy,
  Edit3,
  List,
  Plus,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
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
import { Textarea } from '@/components/ui/textarea';
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { SessionRecord, SessionStatus } from '@/types/pedagogy';

let sessionSeq = 600;
function nextSessionId() {
  sessionSeq += 1;
  return `ses-${sessionSeq}`;
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export default function AdminSessionsPage() {
  const { activeCenter, hasModule } = useDemoSession();
  const {
    sessions,
    groups,
    rooms,
    enrollments,
    addSession,
    updateSession,
  } = usePedagogyStore();
  const { teachers } = useProfilesStore();

  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create / Edit Session Dialog
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(
    null
  );
  const [sTitle, setSTitle] = useState('');
  const [sGroupId, setSGroupId] = useState('');
  const [sTeacherId, setSTeacherId] = useState('');
  const [sRoomId, setSRoomId] = useState('');
  const [sDateISO, setSDateISO] = useState('2026-11-26');
  const [sStart, setSStart] = useState('17:00');
  const [sEnd, setSEnd] = useState('18:30');
  const [sNotes, setSNotes] = useState('');
  const [editScope, setEditScope] = useState<'single' | 'future'>('single');

  // Conflict Arbitration Dialog
  const [arbitrationOpen, setArbitrationOpen] = useState(false);

  // Cancel Session Confirm
  const [cancelTarget, setCancelTarget] = useState<SessionRecord | null>(null);

  const filteredSessions = useMemo(() => {
    if (statusFilter === 'all') return sessions;
    return sessions.filter((s) => s.status === statusFilter);
  }, [sessions, statusFilter]);

  // Detect teacher, room, and shared-student overlaps
  const detectedConflicts = useMemo(() => {
    const issues: string[] = [];
    const selectedGroupStudentIds = new Set(
      enrollments
        .filter((e) => e.groupId === sGroupId && e.status === 'active')
        .map((e) => e.studentId)
    );

    for (const existing of sessions) {
      if (editingSession && existing.id === editingSession.id) continue;
      if (existing.status === 'annulée') continue;
      if (existing.dateISO !== sDateISO) continue;
      if (!timesOverlap(sStart, sEnd, existing.startTime, existing.endTime)) {
        continue;
      }

      if (sRoomId && existing.roomId === sRoomId) {
        issues.push(
          `Chevauchement de salle : « ${existing.roomName} » occupée par ${existing.groupName} (${existing.startTime}–${existing.endTime})`
        );
      }
      if (sTeacherId && existing.teacherId === sTeacherId) {
        issues.push(
          `Chevauchement professeur : ${existing.teacherName} enseigne déjà (${existing.startTime}–${existing.endTime})`
        );
      }
      if (existing.groupId !== sGroupId && selectedGroupStudentIds.size > 0) {
        const sharedStudents = enrollments.filter(
          (e) =>
            e.groupId === existing.groupId &&
            e.status === 'active' &&
            selectedGroupStudentIds.has(e.studentId)
        );
        if (sharedStudents.length > 0) {
          issues.push(
            `Conflit élève(s) : ${sharedStudents
              .map((s) => s.studentName)
              .join(', ')} inscrit(s) aussi dans ${existing.groupName}`
          );
        }
      }
    }
    return issues;
  }, [
    sessions,
    editingSession,
    sDateISO,
    sStart,
    sEnd,
    sRoomId,
    sTeacherId,
    sGroupId,
    enrollments,
  ]);

  const openCreateModal = () => {
    const grp = groups[0];
    setEditingSession(null);
    setSTitle(grp ? `${grp.subjectName} — ${grp.name}` : 'Nouvelle séance');
    setSGroupId(grp?.id ?? '');
    setSTeacherId(grp?.teacherId ?? teachers[0]?.id ?? '');
    setSRoomId(grp?.roomId ?? rooms[0]?.id ?? '');
    setSDateISO('2026-11-26');
    setSStart('17:00');
    setSEnd('18:30');
    setSNotes('');
    setEditScope('single');
    setModalOpen(true);
  };

  const openEditModal = (ses: SessionRecord) => {
    setEditingSession(ses);
    setSTitle(ses.title);
    setSGroupId(ses.groupId);
    setSTeacherId(ses.teacherId);
    setSRoomId(ses.roomId);
    setSDateISO(ses.dateISO);
    setSStart(ses.startTime);
    setSEnd(ses.endTime);
    setSNotes(ses.notes);
    setEditScope('single');
    setModalOpen(true);
  };

  const commitSessionSave = () => {
    const grp = groups.find((g) => g.id === sGroupId);
    const tea = teachers.find((t) => t.id === sTeacherId);
    const rm = rooms.find((r) => r.id === sRoomId);

    const payload = {
      title: sTitle.trim() || 'Séance de soutien',
      subjectId: grp?.subjectId ?? '',
      subjectName: grp?.subjectName ?? 'Soutien',
      groupId: grp?.id ?? sGroupId,
      groupName: grp?.name ?? 'Groupe',
      teacherId: tea?.id ?? sTeacherId,
      teacherName: tea?.fullName ?? 'Professeur',
      siteId: rm?.siteId ?? grp?.siteId ?? '',
      siteName: rm?.siteName ?? grp?.siteName ?? activeCenter.city,
      roomId: rm?.id ?? sRoomId,
      roomName: rm?.name ?? 'Salle',
      dateISO: sDateISO,
      dateLabel:
        sDateISO === '2026-11-26'
          ? "Aujourd'hui"
          : sDateISO === '2026-11-27'
            ? 'Demain'
            : sDateISO,
      startTime: sStart,
      endTime: sEnd,
      durationMinutes: 90,
      capacity: rm?.capacity ?? grp?.capacity ?? 20,
      expectedStudents: grp?.enrolledCount ?? 15,
      notes: sNotes.trim(),
    };

    if (editingSession) {
      updateSession(editingSession.id, payload, editScope);
      toast.success(
        editScope === 'future' && editingSession.recurrenceId
          ? 'Séance et occurrences futures mises à jour'
          : 'Séance mise à jour'
      );
    } else {
      addSession({
        id: nextSessionId(),
        centerId: activeCenter.id,
        presentStudents: 0,
        status: 'planifiée',
        resourceIds: [],
        ...payload,
      });
      toast.success('Séance planifiée (Mode Démo)');
    }
    setArbitrationOpen(false);
    setModalOpen(false);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (detectedConflicts.length > 0) {
      setArbitrationOpen(true);
      return;
    }
    commitSessionSave();
  };

  const columns = useMemo<ColumnDef<SessionRecord>[]>(
    () => [
      {
        accessorKey: 'startTime',
        header: 'Horaire',
        cell: ({ row }) => (
          <div className="font-mono text-xs tabular-nums">
            <p className="font-semibold">
              {row.original.startTime}–{row.original.endTime}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.dateLabel}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Séance & groupe',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.groupName} · {row.original.teacherName}
            </p>
          </div>
        ),
      },
      {
        id: 'room',
        header: 'Salle & site',
        cell: ({ row }) => (
          <div className="text-xs">
            <p>{row.original.roomName}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.siteName}
            </p>
          </div>
        ),
      },
      {
        id: 'attendance',
        header: 'Appel & paie',
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono tabular-nums">
              {row.original.presentStudents}/{row.original.expectedStudents}
            </span>
            <Link
              href="/admin/attendance"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <CheckSquare className="size-3" />
              Appel
            </Link>
            {hasModule('payroll') && (
              <Link
                href="/admin/payroll"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
              >
                <Banknote className="size-3" />
                Paie
              </Link>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const st: SessionStatus = row.original.status;
          const cls =
            st === 'terminée'
              ? 'text-success'
              : st === 'en_cours'
                ? 'text-primary'
                : st === 'annulée'
                  ? 'text-destructive'
                  : 'text-muted-foreground';
          return <span className={`text-xs font-medium ${cls}`}>{st}</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Reprogrammer ${row.original.title}`}
              onClick={() => openEditModal(row.original)}
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Dupliquer ${row.original.title}`}
              onClick={() => {
                addSession({
                  ...row.original,
                  id: nextSessionId(),
                  title: `${row.original.title} (Copie)`,
                  dateISO: '2026-11-28',
                  dateLabel: 'Samedi',
                  status: 'planifiée',
                  presentStudents: 0,
                });
                toast.success('Séance dupliquée pour samedi');
              }}
            >
              <Copy className="size-3.5" />
            </Button>
            {row.original.status !== 'annulée' && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Annuler ${row.original.title}`}
                onClick={() => setCancelTarget(row.original)}
              >
                <XCircle className="size-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasModule]
  );

  return (
    <ModuleGate moduleKey="sessions" allowedRoles={['director', 'secretary']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Séances & planification
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · {sessions.length} séance(s) · arbitrage de
              conflits et lien feuille d&apos;appel
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="size-3.5" />
                Tableau
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                  viewMode === 'timeline'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className="size-3.5" />
                Timeline
              </button>
            </div>
            <Button type="button" size="sm" onClick={openCreateModal}>
              <Plus className="size-4" />
              Nouvelle séance
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'planifiée', 'en_cours', 'terminée', 'annulée'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'all' ? 'Toutes' : st}
              </button>
            )
          )}
        </div>

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={filteredSessions}
            searchPlaceholder="Rechercher une séance, groupe, professeur ou salle..."
            emptyTitle="Aucune séance trouvée"
            emptyDescription="Planifiez une séance pour un groupe actif."
            emptyActionLabel="Nouvelle séance"
            onEmptyAction={openCreateModal}
          />
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((ses) => (
              <div
                key={ses.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-28 font-mono text-xs tabular-nums">
                    <p className="font-semibold text-foreground">
                      {ses.startTime}–{ses.endTime}
                    </p>
                    <p className="text-muted-foreground">{ses.dateLabel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {ses.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ses.groupName} · {ses.teacherName} · {ses.roomName} (
                      {ses.siteName})
                    </p>
                    {ses.notes && (
                      <p className="text-[11px] text-muted-foreground">
                        Note : {ses.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {ses.status}
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => openEditModal(ses)}
                  >
                    Reprogrammer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Session Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Reprogrammer / éditer la séance' : 'Nouvelle séance'}
            </DialogTitle>
            <DialogDescription>
              Détection en direct des conflits salle, professeur et élèves inscrits.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <FormFieldWrapper id="ses-title" label="Titre de la séance" required>
              <Input
                id="ses-title"
                value={sTitle}
                onChange={(e) => setSTitle(e.target.value)}
              />
            </FormFieldWrapper>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="ses-grp" label="Groupe">
                <Select
                  value={sGroupId}
                  onValueChange={(v) => setSGroupId(v ?? '')}
                >
                  <SelectTrigger id="ses-grp" className="w-full">
                    <SelectValue placeholder="Sélectionner" />
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

              <FormFieldWrapper id="ses-tea" label="Professeur">
                <Select
                  value={sTeacherId}
                  onValueChange={(v) => setSTeacherId(v ?? '')}
                >
                  <SelectTrigger id="ses-tea" className="w-full">
                    <SelectValue placeholder="Sélectionner" />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="ses-room" label="Salle">
                <Select
                  value={sRoomId}
                  onValueChange={(v) => setSRoomId(v ?? '')}
                >
                  <SelectTrigger id="ses-room" className="w-full">
                    <SelectValue placeholder="Sélectionner" />
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

              <FormFieldWrapper id="ses-date" label="Date">
                <Input
                  id="ses-date"
                  type="date"
                  value={sDateISO}
                  onChange={(e) => setSDateISO(e.target.value)}
                />
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="ses-start" label="Début">
                <Input
                  id="ses-start"
                  type="time"
                  value={sStart}
                  onChange={(e) => setSStart(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="ses-end" label="Fin">
                <Input
                  id="ses-end"
                  type="time"
                  value={sEnd}
                  onChange={(e) => setSEnd(e.target.value)}
                />
              </FormFieldWrapper>
            </div>

            {editingSession?.recurrenceId && (
              <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                <p className="font-medium text-foreground">
                  Portée de la modification récurrente
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="scope"
                      checked={editScope === 'single'}
                      onChange={() => setEditScope('single')}
                    />
                    Cette séance uniquement
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="scope"
                      checked={editScope === 'future'}
                      onChange={() => setEditScope('future')}
                    />
                    Toutes les séances futures de la série
                  </label>
                </div>
              </div>
            )}

            <FormFieldWrapper id="ses-notes" label="Notes de séance">
              <Textarea
                id="ses-notes"
                rows={2}
                value={sNotes}
                onChange={(e) => setSNotes(e.target.value)}
              />
            </FormFieldWrapper>

            {detectedConflicts.length > 0 && (
              <div className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
                {detectedConflicts.map((c, idx) => (
                  <p key={idx} className="flex items-center gap-1.5 text-foreground">
                    <AlertTriangle className="size-3.5 shrink-0 text-warning" />
                    {c}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {detectedConflicts.length > 0
                  ? 'Arbitrer & enregistrer'
                  : editingSession
                    ? 'Enregistrer'
                    : 'Planifier la séance'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Conflict Arbitration Dialog */}
      <Dialog open={arbitrationOpen} onOpenChange={setArbitrationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              Arbitrage de conflit détecté
            </DialogTitle>
            <DialogDescription>
              Choisissez comment résoudre les chevauchements détectés avant enregistrement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <ul className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-3">
              {detectedConflicts.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSStart('19:00');
                  setSEnd('20:30');
                  setArbitrationOpen(false);
                  toast.info('Créneau décalé à 19:00–20:30, vérifiez et validez.');
                }}
              >
                Décaler le créneau à 19:00–20:30
              </Button>
              <Button type="button" variant="destructive" onClick={commitSessionSave}>
                Maintenir malgré le conflit (démo)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Session Confirm */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null);
        }}
        variant="destructive"
        requireReason
        title={`Annuler la séance « ${cancelTarget?.title} » ?`}
        description="La séance restera visible dans l'historique avec le statut Annulée."
        confirmLabel="Annuler la séance"
        onConfirm={(reason) => {
          if (!cancelTarget) return;
          updateSession(cancelTarget.id, {
            status: 'annulée',
            notes: reason ? `Annulée : ${reason}` : cancelTarget.notes,
          });
          toast.success('Séance annulée (Mode Démo)');
          setCancelTarget(null);
        }}
      />
    </ModuleGate>
  );
}
