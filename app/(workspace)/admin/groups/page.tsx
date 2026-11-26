'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  CalendarDays,
  Copy,
  Edit3,
  LayoutGrid,
  List,
  Plus,
  Printer,
  Sparkles,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
import { CurrencyInput, FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { GroupRecord, GroupStatus } from '@/types/pedagogy';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const CANDIDATE_SLOTS = [
  { days: ['Lun', 'Mer'], timeSlot: '16:30–18:30' },
  { days: ['Mar', 'Jeu'], timeSlot: '18:45–20:15' },
  { days: ['Mer', 'Sam'], timeSlot: '10:00–12:00' },
  { days: ['Ven', 'Sam'], timeSlot: '15:00–17:00' },
];

let groupSeq = 500;
function nextGroupId() {
  groupSeq += 1;
  return `grp-${groupSeq}`;
}

let enrollmentQuickSeq = 800;
function nextQuickEnrollmentRef() {
  enrollmentQuickSeq += 1;
  return {
    id: `enr-${enrollmentQuickSeq}`,
    reference: `INS-2026-0${enrollmentQuickSeq}`,
  };
}

export default function AdminGroupsPage() {
  const { activeCenter } = useDemoSession();
  const {
    groups,
    subjects,
    rooms,
    enrollments,
    addGroup,
    updateGroup,
    closeGroupAndReassign,
    addEnrollment,
    transferEnrollment,
  } = usePedagogyStore();
  const { teachers, students } = useProfilesStore();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form modal (Create / Edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
  const [gName, setGName] = useState('');
  const [gSubjectId, setGSubjectId] = useState('');
  const [gLevel, setGLevel] = useState('2ème Bac');
  const [gFee, setGFee] = useState('750');
  const [gCapacity, setGCapacity] = useState('22');
  const [gTeacherId, setGTeacherId] = useState('');
  const [gRoomId, setGRoomId] = useState('');
  const [gDays, setGDays] = useState<string[]>(['Lun', 'Mer']);
  const [gTimeSlot, setGTimeSlot] = useState('17:00–18:30');
  const [gPeriod, setGPeriod] = useState('2026–2027 · Année scolaire');
  const [gStatus, setGStatus] = useState<GroupStatus>('ouvert');

  // Detail Drawer (Roster, waitlist, transfer, print)
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);
  const [studentToAdd, setStudentToAdd] = useState<string>('');
  const [transferTarget, setTransferTarget] = useState<{
    enrollmentId: string;
    studentName: string;
  } | null>(null);
  const [transferGroupId, setTransferGroupId] = useState('');

  // Close + reassign group dialog
  const [closeTarget, setCloseTarget] = useState<GroupRecord | null>(null);
  const [reassignGroupId, setReassignGroupId] = useState('');

  const activeSubjects = useMemo(
    () => subjects.filter((s) => s.status === 'active'),
    [subjects]
  );

  const filteredGroups = useMemo(() => {
    if (statusFilter === 'all') return groups;
    return groups.filter((g) => g.status === statusFilter);
  }, [groups, statusFilter]);

  const detailGroup = useMemo(
    () => groups.find((g) => g.id === detailGroupId) ?? null,
    [groups, detailGroupId]
  );

  // Live conflict check for modal form
  const formConflicts = useMemo(() => {
    const conflicts: string[] = [];
    for (const grp of groups) {
      if (editingGroup && grp.id === editingGroup.id) continue;
      if (grp.status === 'fermé') continue;
      const shareDay = grp.days.some((d) => gDays.includes(d));
      const sameSlot = grp.timeSlot.trim() === gTimeSlot.trim();
      if (shareDay && sameSlot) {
        if (gRoomId && grp.roomId === gRoomId) {
          conflicts.push(
            `Conflit de salle : « ${grp.roomName} » déjà occupée par ${grp.name}`
          );
        }
        if (gTeacherId && grp.teacherId === gTeacherId) {
          conflicts.push(
            `Conflit professeur : ${grp.teacherName} anime déjà ${grp.name}`
          );
        }
      }
    }
    return conflicts;
  }, [groups, editingGroup, gDays, gTimeSlot, gRoomId, gTeacherId]);

  const freeSlotCandidates = useMemo(() => {
    return CANDIDATE_SLOTS.filter((cand) => {
      return !groups.some((grp) => {
        if (editingGroup && grp.id === editingGroup.id) return false;
        if (grp.status === 'fermé') return false;
        const shareDay = grp.days.some((d) => cand.days.includes(d));
        const sameSlot = grp.timeSlot === cand.timeSlot;
        return (
          shareDay &&
          sameSlot &&
          (grp.roomId === gRoomId || grp.teacherId === gTeacherId)
        );
      });
    });
  }, [groups, editingGroup, gRoomId, gTeacherId]);

  const openCreateModal = () => {
    setEditingGroup(null);
    setGName('');
    setGSubjectId(activeSubjects[0]?.id ?? '');
    setGLevel('2ème Bac');
    setGFee('750');
    setGCapacity('22');
    setGTeacherId(teachers[0]?.id ?? '');
    setGRoomId(rooms.find((r) => r.status === 'disponible')?.id ?? rooms[0]?.id ?? '');
    setGDays(['Mar', 'Jeu']);
    setGTimeSlot('18:45–20:15');
    setGPeriod('2026–2027 · Année scolaire');
    setGStatus('ouvert');
    setFormOpen(true);
  };

  const openEditModal = (grp: GroupRecord) => {
    setEditingGroup(grp);
    setGName(grp.name);
    setGSubjectId(grp.subjectId);
    setGLevel(grp.level);
    setGFee(String(grp.monthlyFeeMad));
    setGCapacity(String(grp.capacity));
    setGTeacherId(grp.teacherId);
    setGRoomId(grp.roomId);
    setGDays(grp.days);
    setGTimeSlot(grp.timeSlot);
    setGPeriod(grp.periodLabel);
    setGStatus(grp.status);
    setFormOpen(true);
  };

  const handleDuplicate = (grp: GroupRecord) => {
    addGroup({
      ...grp,
      id: nextGroupId(),
      name: `${grp.name} (Copie)`,
      enrolledCount: 0,
      waitlistStudentIds: [],
      status: 'ouvert',
    });
    toast.success(`Groupe « ${grp.name} » dupliqué`);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) {
      toast.error('Le nom du groupe est obligatoire.');
      return;
    }
    const sub = subjects.find((s) => s.id === gSubjectId);
    const tea = teachers.find((t) => t.id === gTeacherId);
    const rm = rooms.find((r) => r.id === gRoomId);

    const payload: Omit<GroupRecord, 'id' | 'centerId' | 'enrolledCount' | 'waitlistStudentIds'> = {
      name: gName.trim(),
      subjectId: sub?.id ?? gSubjectId,
      subjectName: sub?.name ?? 'Matière',
      level: gLevel.trim() || '2ème Bac',
      monthlyFeeMad: Number(gFee) || 700,
      capacity: Math.max(1, Number(gCapacity) || 20),
      teacherId: tea?.id ?? gTeacherId,
      teacherName: tea?.fullName ?? 'Professeur à affecter',
      siteId: rm?.siteId ?? '',
      siteName: rm?.siteName ?? activeCenter.locations[0]?.name ?? 'Site principal',
      roomId: rm?.id ?? gRoomId,
      roomName: rm?.name ?? 'Salle standard',
      days: gDays,
      timeSlot: gTimeSlot.trim(),
      periodLabel: gPeriod.trim(),
      status: gStatus,
    };

    if (editingGroup) {
      updateGroup(editingGroup.id, payload);
      toast.success(`Groupe « ${payload.name} » mis à jour`);
    } else {
      addGroup({
        id: nextGroupId(),
        centerId: activeCenter.id,
        enrolledCount: 0,
        waitlistStudentIds: [],
        ...payload,
      });
      toast.success(`Groupe « ${payload.name} » créé (Mode Démo)`);
    }
    setFormOpen(false);
  };

  const columns = useMemo<ColumnDef<GroupRecord>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Groupe & matière',
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => setDetailGroupId(row.original.id)}
              className="text-left font-medium text-foreground hover:text-primary hover:underline"
            >
              {row.original.name}
            </button>
            <p className="text-[11px] text-muted-foreground">
              {row.original.subjectName} · {row.original.level}
            </p>
          </div>
        ),
      },
      {
        id: 'schedule',
        header: 'Créneau & salle',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium">
              {row.original.days.join(', ')} ·{' '}
              <span className="font-mono tabular-nums">{row.original.timeSlot}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.roomName} ({row.original.siteName})
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'teacherName',
        header: 'Professeur',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.teacherName}</span>
        ),
      },
      {
        id: 'occupancy',
        header: 'Occupation',
        cell: ({ row }) => {
          const pct = Math.min(
            100,
            Math.round((row.original.enrolledCount / Math.max(1, row.original.capacity)) * 100)
          );
          return (
            <div className="w-28 space-y-1">
              <div className="flex items-center justify-between text-xs tabular-nums">
                <span className="font-medium">
                  {row.original.enrolledCount}/{row.original.capacity}
                </span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    pct >= 100
                      ? 'bg-destructive'
                      : pct >= 85
                        ? 'bg-warning'
                        : 'bg-primary'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'monthlyFeeMad',
        header: 'Tarif / mois',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium tabular-nums">
            {formatMAD(row.original.monthlyFeeMad)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'État',
        cell: ({ row }) => (
          <span
            className={`text-xs font-medium ${
              row.original.status === 'ouvert'
                ? 'text-success'
                : row.original.status === 'complet'
                  ? 'text-warning'
                  : 'text-muted-foreground'
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Éditer ${row.original.name}`}
              onClick={() => openEditModal(row.original)}
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Dupliquer ${row.original.name}`}
              onClick={() => handleDuplicate(row.original)}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups]
  );

  const detailEnrollments = useMemo(() => {
    if (!detailGroup) return [];
    return enrollments.filter(
      (e) => e.groupId === detailGroup.id && e.status === 'active'
    );
  }, [enrollments, detailGroup]);

  const studentsNotInDetailGroup = useMemo(() => {
    if (!detailGroup) return [];
    const enrolledIds = new Set(detailEnrollments.map((e) => e.studentId));
    return students.filter((s) => !enrolledIds.has(s.id));
  }, [students, detailEnrollments, detailGroup]);

  return (
    <ModuleGate moduleKey="groups" allowedRoles={['director', 'secretary']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Groupes & classes de soutien
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · {groups.length} groupe(s) · occupation, listes
              d&apos;attente et détection de conflits
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="size-3.5" />
                Cartes
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="size-3.5" />
                Tableau
              </button>
            </div>
            <Button type="button" size="sm" onClick={openCreateModal}>
              <Plus className="size-4" />
              Nouveau groupe
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'ouvert', 'complet', 'liste_attente', 'fermé'] as const).map(
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
                  {st === 'all'
                    ? 'Tous'
                    : st === 'liste_attente'
                      ? "Liste d'attente"
                      : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              )
            )}
          </div>
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <CalendarDays className="size-3.5" />
            Voir les séances planifiées →
          </Link>
        </div>

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={filteredGroups}
            searchPlaceholder="Rechercher un groupe, professeur, salle..."
            emptyTitle="Aucun groupe trouvé"
            emptyDescription="Créez un groupe ou modifiez votre filtre."
            emptyActionLabel="Nouveau groupe"
            onEmptyAction={openCreateModal}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((grp) => {
              const pct = Math.min(
                100,
                Math.round((grp.enrolledCount / Math.max(1, grp.capacity)) * 100)
              );
              const subColor =
                subjects.find((s) => s.id === grp.subjectId)?.color ?? '#2563eb';
              return (
                <Card key={grp.id} className="border-border shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="size-2.5 rounded-sm"
                            style={{ backgroundColor: subColor }}
                          />
                          <span>{grp.subjectName}</span>
                          <span>·</span>
                          <span>{grp.level}</span>
                        </div>
                        <CardTitle className="mt-1 font-heading text-base">
                          {grp.name}
                        </CardTitle>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          grp.status === 'ouvert'
                            ? 'text-success'
                            : grp.status === 'complet'
                              ? 'text-warning'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {grp.status === 'liste_attente'
                          ? 'Attente'
                          : grp.status.charAt(0).toUpperCase() + grp.status.slice(1)}
                      </span>
                    </div>
                    <CardDescription className="text-xs">
                      {grp.teacherName} · {grp.roomName} ({grp.siteName})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {grp.days.join(', ')} ·{' '}
                        <span className="font-mono text-foreground">
                          {grp.timeSlot}
                        </span>
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatMAD(grp.monthlyFeeMad)}/mois
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="text-muted-foreground">
                          Occupation ({grp.enrolledCount}/{grp.capacity} places)
                        </span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 100
                              ? 'bg-destructive'
                              : pct >= 85
                                ? 'bg-warning'
                                : 'bg-primary'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {grp.waitlistStudentIds.length > 0 && (
                        <p className="text-[11px] font-medium text-warning">
                          {grp.waitlistStudentIds.length} élève(s) en liste d&apos;attente
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => setDetailGroupId(grp.id)}
                      >
                        <Users className="size-3.5" />
                        Roster & gestion
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Modifier ${grp.name}`}
                          onClick={() => openEditModal(grp)}
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Dupliquer ${grp.name}`}
                          onClick={() => handleDuplicate(grp)}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        {grp.status !== 'fermé' && (
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={`Fermer ${grp.name}`}
                            onClick={() => {
                              setCloseTarget(grp);
                              const alt = groups.find(
                                (g) => g.id !== grp.id && g.status !== 'fermé'
                              );
                              setReassignGroupId(alt?.id ?? '');
                            }}
                          >
                            <XCircle className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Group Modal with Conflict Detection & Slot Finder */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Modifier le groupe' : 'Nouveau groupe de soutien'}
            </DialogTitle>
            <DialogDescription>
              Vérification automatique des conflits salle / professeur en Mode Démo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveGroup} className="space-y-4">
            <FormFieldWrapper id="grp-name" label="Nom du groupe" required>
              <Input
                id="grp-name"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                placeholder="Ex: 2Bac PC — Excellence"
              />
            </FormFieldWrapper>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="grp-sub" label="Matière" required>
                <Select
                  value={gSubjectId}
                  onValueChange={(v) => setGSubjectId(v ?? '')}
                >
                  <SelectTrigger id="grp-sub" className="w-full">
                    <SelectValue placeholder="Choisir matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              <FormFieldWrapper id="grp-lvl" label="Niveau">
                <Input
                  id="grp-lvl"
                  value={gLevel}
                  onChange={(e) => setGLevel(e.target.value)}
                />
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormFieldWrapper id="grp-fee" label="Tarif mensuel" required>
                <CurrencyInput
                  id="grp-fee"
                  value={gFee}
                  onChange={(e) => setGFee(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="grp-cap" label="Capacité max" required>
                <Input
                  id="grp-cap"
                  type="number"
                  min={1}
                  value={gCapacity}
                  onChange={(e) => setGCapacity(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="grp-status" label="État">
                <Select
                  value={gStatus}
                  onValueChange={(v) =>
                    setGStatus((v as GroupStatus) ?? 'ouvert')
                  }
                >
                  <SelectTrigger id="grp-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ouvert">Ouvert</SelectItem>
                    <SelectItem value="complet">Complet</SelectItem>
                    <SelectItem value="liste_attente">Liste d&apos;attente</SelectItem>
                    <SelectItem value="fermé">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="grp-tea" label="Professeur">
                <Select
                  value={gTeacherId}
                  onValueChange={(v) => setGTeacherId(v ?? '')}
                >
                  <SelectTrigger id="grp-tea" className="w-full">
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

              <FormFieldWrapper id="grp-room" label="Salle & site">
                <Select
                  value={gRoomId}
                  onValueChange={(v) => setGRoomId(v ?? '')}
                >
                  <SelectTrigger id="grp-room" className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} · {r.siteName} ({r.capacity} pl.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">
                  Jours & créneau horaire
                </p>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const best = freeSlotCandidates[0];
                    if (!best) {
                      toast.warning(
                        'Aucun créneau type libre trouvé, ajustez manuellement.'
                      );
                      return;
                    }
                    setGDays(best.days);
                    setGTimeSlot(best.timeSlot);
                    toast.success(
                      `Créneau libre suggéré : ${best.days.join(', ')} · ${best.timeSlot}`
                    );
                  }}
                >
                  <Sparkles className="size-3.5" />
                  Trouver un créneau libre
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const checked = gDays.includes(day);
                  return (
                    <label
                      key={day}
                      className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          if (v) setGDays((prev) => [...prev, day]);
                          else setGDays((prev) => prev.filter((d) => d !== day));
                        }}
                      />
                      <span>{day}</span>
                    </label>
                  );
                })}
              </div>
              <div className="grid gap-3 pt-1 sm:grid-cols-2">
                <FormFieldWrapper id="grp-slot" label="Créneau">
                  <Input
                    id="grp-slot"
                    value={gTimeSlot}
                    onChange={(e) => setGTimeSlot(e.target.value)}
                    placeholder="17:00–18:30"
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="grp-per" label="Période">
                  <Input
                    id="grp-per"
                    value={gPeriod}
                    onChange={(e) => setGPeriod(e.target.value)}
                  />
                </FormFieldWrapper>
              </div>
            </div>

            {formConflicts.length > 0 && (
              <div className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {formConflicts.map((msg, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    {msg}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingGroup ? 'Enregistrer' : 'Créer le groupe'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Roster & Management Drawer */}
      <Sheet
        open={Boolean(detailGroup)}
        onOpenChange={(o) => {
          if (!o) setDetailGroupId(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detailGroup && (
            <>
              <SheetHeader>
                <SheetTitle>{detailGroup.name}</SheetTitle>
                <SheetDescription>
                  {detailGroup.subjectName} · {detailGroup.teacherName} ·{' '}
                  {detailGroup.days.join(', ')} {detailGroup.timeSlot}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                  <span>
                    Places :{' '}
                    <strong className="font-mono tabular-nums">
                      {detailGroup.enrolledCount}/{detailGroup.capacity}
                    </strong>{' '}
                    · Tarif :{' '}
                    <strong className="font-mono tabular-nums">
                      {formatMAD(detailGroup.monthlyFeeMad)}
                    </strong>
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      toast.success('Préparation de la feuille d’impression (démo)');
                      if (typeof window !== 'undefined') window.print();
                    }}
                  >
                    <Printer className="size-3.5" />
                    Imprimer liste
                  </Button>
                </div>

                {/* Add student directly */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Associer un élève au groupe
                  </p>
                  <div className="flex gap-2">
                    <Select
                      value={studentToAdd}
                      onValueChange={(v) => setStudentToAdd(v ?? '')}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner un élève..." />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsNotInDetailGroup.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.firstName} {s.lastName} ({s.level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!studentToAdd}
                      onClick={() => {
                        const stu = students.find((s) => s.id === studentToAdd);
                        if (!stu) return;
                        const isFull =
                          detailGroup.enrolledCount >= detailGroup.capacity;
                        const { id, reference } = nextQuickEnrollmentRef();
                        addEnrollment({
                          id,
                          centerId: activeCenter.id,
                          reference,
                          studentId: stu.id,
                          studentName: `${stu.firstName} ${stu.lastName}`,
                          groupId: detailGroup.id,
                          groupName: detailGroup.name,
                          periodLabel: detailGroup.periodLabel,
                          status: isFull ? 'liste_attente' : 'active',
                          agreedFeeMad: detailGroup.monthlyFeeMad,
                          discountPercent: stu.discountPercent,
                          netMonthlyMad: Math.round(
                            detailGroup.monthlyFeeMad *
                              (1 - stu.discountPercent / 100)
                          ),
                          installmentsCount: 10,
                          source: 'Accueil',
                          createdAtLabel: "Aujourd'hui",
                        });
                        toast.success(
                          isFull
                            ? `${stu.firstName} ajouté(e) en liste d'attente`
                            : `${stu.firstName} inscrit(e) dans ${detailGroup.name}`
                        );
                        setStudentToAdd('');
                      }}
                    >
                      <UserPlus className="size-3.5" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Enrolled roster */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Élèves inscrits ({detailEnrollments.length})
                  </p>
                  {detailEnrollments.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Aucun élève inscrit dans ce groupe pour le moment.
                    </p>
                  ) : (
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {detailEnrollments.map((enr) => (
                        <div
                          key={enr.id}
                          className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs"
                        >
                          <div>
                            <Link
                              href={`/admin/students/${enr.studentId}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {enr.studentName}
                            </Link>
                            <p className="text-[11px] text-muted-foreground">
                              {enr.reference} ·{' '}
                              <span className="font-mono">
                                {formatMAD(enr.netMonthlyMad)}/mois
                              </span>
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setTransferTarget({
                                enrollmentId: enr.id,
                                studentName: enr.studentName,
                              });
                              const alt = groups.find(
                                (g) =>
                                  g.id !== detailGroup.id && g.status !== 'fermé'
                              );
                              setTransferGroupId(alt?.id ?? '');
                            }}
                          >
                            Transférer
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Waitlist */}
                {detailGroup.waitlistStudentIds.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-warning">
                      Liste d&apos;attente ({detailGroup.waitlistStudentIds.length})
                    </p>
                    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                      {detailGroup.waitlistStudentIds.map((sid) => {
                        const stu = students.find((s) => s.id === sid);
                        return (
                          <div key={sid} className="flex items-center justify-between py-1">
                            <span>
                              {stu
                                ? `${stu.firstName} ${stu.lastName}`
                                : sid}
                            </span>
                            <span className="text-muted-foreground">En attente de place</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Transfer student modal */}
      <Dialog
        open={Boolean(transferTarget)}
        onOpenChange={(o) => {
          if (!o) setTransferTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transférer {transferTarget?.studentName}</DialogTitle>
            <DialogDescription>
              Déplace l&apos;inscription vers un autre groupe actif du centre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormFieldWrapper id="trf-grp" label="Nouveau groupe cible">
              <Select
                value={transferGroupId}
                onValueChange={(v) => setTransferGroupId(v ?? '')}
              >
                <SelectTrigger id="trf-grp" className="w-full">
                  <SelectValue placeholder="Choisir un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter((g) => g.id !== detailGroupId && g.status !== 'fermé')
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.enrolledCount}/{g.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferTarget(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!transferGroupId}
                onClick={() => {
                  if (!transferTarget) return;
                  const tg = groups.find((g) => g.id === transferGroupId);
                  if (!tg) return;
                  transferEnrollment(
                    transferTarget.enrollmentId,
                    tg.id,
                    tg.name
                  );
                  toast.success(
                    `${transferTarget.studentName} transféré(e) vers ${tg.name}`
                  );
                  setTransferTarget(null);
                }}
              >
                Confirmer le transfert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Group & Reassign Confirm */}
      <Dialog
        open={Boolean(closeTarget)}
        onOpenChange={(o) => {
          if (!o) setCloseTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Fermer « {closeTarget?.name} » et réaffecter ?
            </DialogTitle>
            <DialogDescription>
              Les élèves inscrits seront transférés vers le groupe de destination choisi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormFieldWrapper id="close-target" label="Groupe de réaffectation">
              <Select
                value={reassignGroupId}
                onValueChange={(v) => setReassignGroupId(v ?? '')}
              >
                <SelectTrigger id="close-target" className="w-full">
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter((g) => g.id !== closeTarget?.id && g.status !== 'fermé')
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.enrolledCount}/{g.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCloseTarget(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!reassignGroupId}
                onClick={() => {
                  if (!closeTarget || !reassignGroupId) return;
                  closeGroupAndReassign(closeTarget.id, reassignGroupId);
                  toast.success(
                    `Groupe « ${closeTarget.name} » fermé et élèves réaffectés`
                  );
                  setCloseTarget(null);
                }}
              >
                Fermer & réaffecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleGate>
  );
}
