'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Printer,
  QrCode,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ModuleGate } from '@/components/feedback/module-gate';
import { EmptyState, GlobalBanner } from '@/components/feedback/states';
import { DataTable, type BulkAction } from '@/components/tables/data-table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAttendanceStore } from '@/stores/attendance-context';
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import type {
  AttendanceRecord,
  AttendanceStatus,
  QrScanLogEntry,
  QrValidationOutcome,
} from '@/types/attendance';

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  present: {
    label: 'Présent',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  retard: {
    label: 'En retard',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  absent: {
    label: 'Absent',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  excuse: {
    label: 'Excusé',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-700 dark:text-sky-300',
  },
  non_pointe: {
    label: 'Non pointé',
    dotClass: 'bg-slate-400',
    textClass: 'text-muted-foreground',
  },
};

const SOURCE_LABELS: Record<AttendanceRecord['source'], string> = {
  qr_simule: 'QR simulé',
  appel_manuel: 'Appel manuel',
  saisie_admin: 'Correction admin',
  non_pointe: 'En attente',
};

const QR_OUTCOME_LABELS: Record<
  QrValidationOutcome,
  { label: string; textClass: string }
> = {
  present: {
    label: 'Validé (démo)',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  deja_enregistre: {
    label: 'Doublon bloqué',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  mauvaise_seance: {
    label: 'Mauvaise séance',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  eleve_non_inscrit: {
    label: 'Élève non inscrit',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  qr_expire: {
    label: 'QR expiré',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  hors_creneau: {
    label: 'Hors créneau',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  erreur_reseau: {
    label: 'Erreur réseau simulée',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
};

function sanitizeCsvCell(raw: string): string {
  const value = String(raw ?? '');
  const trimmed = value.trimStart();
  const safe =
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
      ? `'${value}`
      : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

const HEATMAP_ROWS = [
  {
    slot: 'Matin (09:00–12:30)',
    days: [94, 91, 96, 89, 92, 95],
  },
  {
    slot: 'Après-midi (14:00–18:00)',
    days: [92, 88, 95, 90, 87, 93],
  },
  {
    slot: 'Soir (18:15–21:00)',
    days: [86, 84, 91, 82, 79, 88],
  },
];

const HEATMAP_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function AdminAttendancePage() {
  const { activeCenter, activeUser, hasModule } = useDemoSession();
  const {
    records,
    qrLogs,
    absenceAlerts,
    updateAttendanceStatus,
    bulkMarkAttendance,
    updateAlertStatus,
  } = useAttendanceStore();
  const { sessions, groups } = usePedagogyStore();

  const qrEnabled = hasModule('attendance.qr');
  const analyticsEnabled = hasModule('attendance.analytics');
  const alertsEnabled = hasModule('attendance.alerts');
  const justificationsEnabled = hasModule('attendance.justifications');

  const [periodFilter, setPeriodFilter] = useState<'today' | 'week'>('today');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [qrOutcomeFilter, setQrOutcomeFilter] = useState<string>('all');

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editNote, setEditNote] = useState('');
  const [editJustificationReason, setEditJustificationReason] = useState('');
  const [editJustificationDoc, setEditJustificationDoc] = useState('');

  const [detailQrLog, setDetailQrLog] = useState<QrScanLogEntry | null>(null);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);

  const [bulkConfirm, setBulkConfirm] = useState<{
    ids: string[];
    status: AttendanceStatus;
    clear: () => void;
  } | null>(null);

  const [alertPreviewId, setAlertPreviewId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (periodFilter === 'today' && rec.dateISO !== '2026-11-26') {
        return false;
      }
      if (sessionFilter !== 'all' && rec.sessionId !== sessionFilter) {
        return false;
      }
      return true;
    });
  }, [records, periodFilter, sessionFilter]);

  const filteredQrLogs = useMemo(() => {
    if (qrOutcomeFilter === 'all') return qrLogs;
    return qrLogs.filter((l) => l.outcome === qrOutcomeFilter);
  }, [qrLogs, qrOutcomeFilter]);

  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const late = filteredRecords.filter((r) => r.status === 'retard').length;
    const absentOrPending = filteredRecords.filter(
      (r) => r.status === 'absent' || r.status === 'non_pointe'
    ).length;
    const marked = filteredRecords.filter((r) => r.status !== 'non_pointe').length;
    const rate =
      marked > 0 ? Math.round(((present + late) / marked) * 100) : 0;
    return { total, present, late, absentOrPending, rate };
  }, [filteredRecords]);

  const groupStats = useMemo(() => {
    return groups.map((grp) => {
      const grpRecords = records.filter((r) => r.groupId === grp.id);
      const marked = grpRecords.filter((r) => r.status !== 'non_pointe');
      const ok = marked.filter(
        (r) => r.status === 'present' || r.status === 'retard'
      );
      const rate =
        marked.length > 0 ? Math.round((ok.length / marked.length) * 100) : 92;
      return {
        id: grp.id,
        name: grp.name,
        subjectName: grp.subjectName,
        totalRecords: grpRecords.length,
        rate,
      };
    });
  }, [groups, records]);

  const openEditSheet = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditStatus(rec.status);
    setEditNote(rec.note);
    setEditJustificationReason(rec.justificationReason ?? '');
    setEditJustificationDoc(rec.justificationDocName ?? '');
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    const isModifyingMarked =
      editingRecord.status !== 'non_pointe' &&
      editingRecord.status !== editStatus;
    const needsJustification = isModifyingMarked || editStatus === 'excuse';

    if (needsJustification && editJustificationReason.trim().length < 4) {
      toast.error(
        'Une justification (min. 4 caractères) est obligatoire pour corriger ou excuser ce pointage.'
      );
      return;
    }

    updateAttendanceStatus(editingRecord.id, {
      status: editStatus,
      note: editNote.trim(),
      justificationReason: editJustificationReason.trim() || undefined,
      justificationDocName: editJustificationDoc.trim() || undefined,
      source: 'saisie_admin',
      actor: activeUser.fullName,
    });

    toast.success(`Pointage mis à jour pour ${editingRecord.studentName}`);
    setEditingRecord(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'Code élève',
      'Élève',
      'Date',
      'Horaire',
      'Séance',
      'Groupe',
      'Statut',
      'Heure pointage',
      'Source',
      'Justification',
    ];
    const rows = filteredRecords.map((r) => [
      r.studentCode,
      r.studentName,
      r.dateISO,
      r.timeSlot,
      r.sessionTitle,
      r.groupName,
      STATUS_META[r.status].label,
      r.checkInTime,
      SOURCE_LABELS[r.source],
      r.justificationReason ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map(sanitizeCsvCell).join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presences-${activeCenter.id}-${periodFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV UTF-8 généré (cellules protégées contre injection).');
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: 'studentName',
      header: 'Élève',
      cell: ({ row }) => {
        const rec = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {rec.studentInitials}
            </span>
            <div>
              <Link
                href={`/admin/students/${rec.studentId}`}
                className="font-medium hover:underline"
              >
                {rec.studentName}
              </Link>
              <p className="font-mono text-[11px] text-muted-foreground">
                {rec.studentCode}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'sessionTitle',
      header: 'Séance & horaire',
      cell: ({ row }) => {
        const rec = row.original;
        return (
          <div className="max-w-[240px]">
            <p className="truncate text-xs font-medium">{rec.groupName}</p>
            <p className="truncate text-[11px] text-muted-foreground tabular-nums">
              {rec.dateLabel} · {rec.timeSlot} · {rec.roomName}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const rec = row.original;
        const meta = STATUS_META[rec.status];
        return (
          <div className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full', meta.dotClass)} />
            <span className={cn('text-xs font-medium', meta.textClass)}>
              {meta.label}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'checkInTime',
      header: 'Pointage & source',
      cell: ({ row }) => {
        const rec = row.original;
        return (
          <div className="text-xs">
            <span className="font-mono tabular-nums">{rec.checkInTime}</span>
            <p className="text-[11px] text-muted-foreground">
              {SOURCE_LABELS[rec.source]}
              {rec.source === 'qr_simule' ? ' · non vérifié serveur' : ''}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'justificationReason',
      header: 'Notes / justificatif',
      cell: ({ row }) => {
        const rec = row.original;
        return (
          <div className="max-w-[200px] text-xs text-muted-foreground">
            <p className="truncate">
              {rec.justificationReason ?? rec.note ?? '—'}
            </p>
            {rec.justificationDocName && (
              <p className="truncate font-mono text-[11px] text-primary">
                {rec.justificationDocName}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const rec = row.original;
        const matchingLog = qrLogs.find(
          (l) => l.sessionId === rec.sessionId && l.studentId === rec.studentId
        );
        return (
          <div className="flex items-center justify-end gap-1.5">
            {qrEnabled && matchingLog && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDetailQrLog(matchingLog)}
                className="h-7 px-2 text-xs"
              >
                Détail QR
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openEditSheet(rec)}
              className="h-7 px-2.5 text-xs"
            >
              Corriger
            </Button>
          </div>
        );
      },
    },
  ];

  const bulkActions: BulkAction<AttendanceRecord>[] = [
    {
      id: 'mark-present',
      label: 'Marquer présent',
      onExecute: (rows, clear) =>
        setBulkConfirm({
          ids: rows.map((r) => r.id),
          status: 'present',
          clear,
        }),
    },
    {
      id: 'mark-absent',
      label: 'Marquer absent',
      variant: 'destructive',
      onExecute: (rows, clear) =>
        setBulkConfirm({
          ids: rows.map((r) => r.id),
          status: 'absent',
          clear,
        }),
    },
    {
      id: 'mark-excused',
      label: 'Justifier',
      variant: 'outline',
      onExecute: (rows, clear) =>
        setBulkConfirm({
          ids: rows.map((r) => r.id),
          status: 'excuse',
          clear,
        }),
    },
  ];

  const selectedAlert = absenceAlerts.find((a) => a.id === alertPreviewId);

  return (
    <ModuleGate
      moduleKey="attendance.manual"
      allowedRoles={['director', 'secretary']}
    >
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Présences & suivi QR
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Appel par séance, corrections justifiées et
              anomalies QR (Mode Démo)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrintPreviewOpen(true)}
              className="gap-1.5"
            >
              <Printer className="size-4" />
              Imprimer feuille
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        <GlobalBanner
          tone="info"
          title="Simulation locale des scans QR"
          description={
            qrEnabled
              ? "Les pointages marqués « QR simulé » proviennent de l'interface de test. En production, chaque scan exigera une validation cryptographique et horaire côté serveur."
              : "Le module QR étudiant est désactivé sur cette instance : seul l'appel manuel et la saisie administrative sont actifs."
          }
        />

        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Taux de présence (données démo)
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {kpis.rate} %
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Sur {kpis.total} pointages filtrés
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">Présents</CardDescription>
              <CardTitle className="font-mono text-2xl text-emerald-600 tabular-nums dark:text-emerald-400">
                {kpis.present}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              QR simulé ou appel manuel
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">En retard</CardDescription>
              <CardTitle className="font-mono text-2xl text-amber-600 tabular-nums dark:text-amber-400">
                {kpis.late}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Arrivées après début de séance
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Absents & non pointés
              </CardDescription>
              <CardTitle className="font-mono text-2xl text-rose-600 tabular-nums dark:text-rose-400">
                {kpis.absentOrPending}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              À relancer ou régulariser
            </CardContent>
          </Card>
        </div>

        {/* Filtres période & séance */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setPeriodFilter('today')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                periodFilter === 'today'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Aujourd&apos;hui (26 nov.)
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('week')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                periodFilter === 'week'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Toute la semaine
            </button>
          </div>

          <Select
            value={sessionFilter}
            onValueChange={(v) => setSessionFilter(v ?? 'all')}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[290px]">
              <SelectValue placeholder="Filtrer par séance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les séances</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.dateLabel} · {s.startTime} — {s.groupName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Onglets principaux */}
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList className="flex flex-wrap justify-start">
            <TabsTrigger value="grid">Grille d&apos;appel</TabsTrigger>
            <TabsTrigger value="qr-logs">
              Journaux & anomalies QR ({qrLogs.length})
            </TabsTrigger>
            <TabsTrigger value="stats">Statistiques & Heatmap</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertes absences ({absenceAlerts.length})
            </TabsTrigger>
          </TabsList>

          {/* 1. Grille d'appel */}
          <TabsContent value="grid">
            <DataTable
              columns={columns}
              data={filteredRecords}
              searchPlaceholder="Rechercher élève, code ELV ou groupe..."
              facetColumnId="status"
              facetOptions={[
                { value: 'present', label: 'Présent' },
                { value: 'retard', label: 'En retard' },
                { value: 'absent', label: 'Absent' },
                { value: 'excuse', label: 'Excusé' },
                { value: 'non_pointe', label: 'Non pointé' },
              ]}
              enableRowSelection
              bulkActions={bulkActions}
              emptyTitle="Aucun pointage sur ce filtre"
              emptyDescription="Élargissez la période ou sélectionnez une autre séance."
              emptyActionLabel="Afficher toute la semaine"
              onEmptyAction={() => {
                setPeriodFilter('week');
                setSessionFilter('all');
              }}
              renderMobileCard={(rec, isSelected, toggleSelect) => {
                const meta = STATUS_META[rec.status];
                return (
                  <div className="space-y-2 rounded-xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={toggleSelect}
                        className="text-left"
                      >
                        <p className="text-sm font-semibold">
                          {isSelected ? '✓ ' : ''}
                          {rec.studentName}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {rec.studentCode} · {rec.groupName}
                        </p>
                      </button>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium',
                          meta.textClass
                        )}
                      >
                        <span
                          className={cn('size-2 rounded-full', meta.dotClass)}
                        />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {rec.dateLabel} · {rec.timeSlot} ·{' '}
                      {SOURCE_LABELS[rec.source]} ({rec.checkInTime})
                    </p>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditSheet(rec)}
                      >
                        Corriger
                      </Button>
                    </div>
                  </div>
                );
              }}
            />
          </TabsContent>

          {/* 2. Journaux & Anomalies QR */}
          <TabsContent value="qr-logs" className="space-y-4">
            {!qrEnabled ? (
              <EmptyState
                icon={<QrCode className="size-5" />}
                title="Module QR désactivé sur cette instance"
                description="Le module Présences QR (attendance.qr) n'est pas activé sur ce centre. Les journaux de scan ne sont pas disponibles."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Historique simulé des scans QR (doublons, jetons expirés,
                    élèves non inscrits, erreurs réseau).
                  </p>
                  <Select
                    value={qrOutcomeFilter}
                    onValueChange={(v) => setQrOutcomeFilter(v ?? 'all')}
                  >
                    <SelectTrigger className="h-8 w-[220px] text-xs">
                      <SelectValue placeholder="Filtrer résultat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les résultats</SelectItem>
                      <SelectItem value="present">Validé (démo)</SelectItem>
                      <SelectItem value="deja_enregistre">
                        Doublon bloqué
                      </SelectItem>
                      <SelectItem value="eleve_non_inscrit">
                        Élève non inscrit
                      </SelectItem>
                      <SelectItem value="qr_expire">QR expiré</SelectItem>
                      <SelectItem value="mauvaise_seance">
                        Mauvaise séance
                      </SelectItem>
                      <SelectItem value="hors_creneau">Hors créneau</SelectItem>
                      <SelectItem value="erreur_reseau">
                        Erreur réseau
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredQrLogs.length === 0 ? (
                  <EmptyState
                    icon={<QrCode className="size-5" />}
                    title="Aucun log QR correspondant"
                    description="Aucune tentative de scan ne correspond au filtre sélectionné."
                    actionLabel="Tout afficher"
                    onAction={() => setQrOutcomeFilter('all')}
                  />
                ) : (
                  <div className="divide-y divide-border rounded-xl border border-border bg-card">
                    {filteredQrLogs.map((log) => {
                      const outcomeMeta = QR_OUTCOME_LABELS[log.outcome];
                      return (
                        <div
                          key={log.id}
                          className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'text-xs font-semibold',
                                  outcomeMeta.textClass
                                )}
                              >
                                {outcomeMeta.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ·
                              </span>
                              <span className="text-sm font-medium">
                                {log.studentName}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                ({log.studentCode})
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {log.message}
                            </p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              {log.sessionTitle} · {log.teacherName} ·{' '}
                              {log.scannedAtLabel}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailQrLog(log)}
                          >
                            Détail QR
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* 3. Statistiques & Heatmap */}
          <TabsContent value="stats" className="space-y-4">
            {!analyticsEnabled ? (
              <EmptyState
                icon={<Clock className="size-5" />}
                title="Analytique de présences non activée"
                description="Le module attendance.analytics n'est pas inclus dans la configuration de cette instance."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Assiduité comparée par groupe
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Données démo calculées depuis la grille active
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupStats.map((g) => (
                      <div key={g.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">
                            {g.name} ·{' '}
                            <span className="text-muted-foreground">
                              {g.subjectName}
                            </span>
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {g.rate} %
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${g.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Heatmap de présence hebdomadaire
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Taux moyen par créneau et jour (Données démo)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr>
                            <th className="py-2 pr-2 text-left font-medium text-muted-foreground">
                              Créneau
                            </th>
                            {HEATMAP_DAYS.map((d) => (
                              <th
                                key={d}
                                className="px-1.5 py-2 text-center font-medium text-muted-foreground"
                              >
                                {d}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {HEATMAP_ROWS.map((row) => (
                            <tr key={row.slot}>
                              <td className="py-2 pr-2 font-medium">
                                {row.slot}
                              </td>
                              {row.days.map((pct, idx) => (
                                <td key={idx} className="p-1 text-center">
                                  <div
                                    className={cn(
                                      'rounded-md px-1.5 py-1.5 font-mono text-[11px] font-medium tabular-nums',
                                      pct >= 93
                                        ? 'bg-emerald-500/18 text-emerald-800 dark:text-emerald-200'
                                        : pct >= 87
                                          ? 'bg-sky-500/15 text-sky-800 dark:text-sky-200'
                                          : 'bg-amber-500/18 text-amber-800 dark:text-amber-200'
                                    )}
                                  >
                                    {pct}%
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 4. Alertes absences répétées */}
          <TabsContent value="alerts" className="space-y-4">
            {!alertsEnabled ? (
              <EmptyState
                icon={<AlertTriangle className="size-5" />}
                title="Alertes d'absences désactivées"
                description="Activez le module attendance.alerts dans la configuration de l'instance pour suivre les seuils d'absences répétées."
              />
            ) : absenceAlerts.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="size-5" />}
                title="Aucune alerte d'absence répétée"
                description="Tous les élèves du centre sont sous le seuil d'alerte."
              />
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border bg-card">
                {absenceAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/students/${alert.studentId}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {alert.studentName}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground">
                          {alert.studentCode}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {alert.groupName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {alert.consecutiveAbsences} absences consécutives ·{' '}
                        {alert.totalMonthAbsences} ce mois-ci · Dernière :{' '}
                        {alert.lastSessionDate}
                      </p>
                      <p className="text-xs">
                        Responsable :{' '}
                        <span className="font-medium">
                          {alert.guardianName}
                        </span>{' '}
                        ·{' '}
                        <span
                          className={
                            alert.guardianEligible
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-amber-700 dark:text-amber-300'
                          }
                        >
                          {alert.guardianEligible
                            ? 'Consentement actif'
                            : 'Consentement manquant / canal bloqué'}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {alert.status === 'a_traiter' && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!alert.guardianEligible}
                            onClick={() => setAlertPreviewId(alert.id)}
                          >
                            Prévisualiser alerte (démo)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              updateAlertStatus(alert.id, 'justifie');
                              toast.success(
                                `Alerte classée justifiée pour ${alert.studentName}`
                              );
                            }}
                          >
                            Classer justifiée
                          </Button>
                        </>
                      )}
                      {alert.status === 'parent_prevenu_demo' && (
                        <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                          Prévisualisé / simulé (démo)
                        </span>
                      )}
                      {alert.status === 'justifie' && (
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Justifiée
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Sheet de correction / justification */}
        <Sheet
          open={Boolean(editingRecord)}
          onOpenChange={(open) => !open && setEditingRecord(null)}
        >
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Corriger le pointage</SheetTitle>
              <SheetDescription>
                {editingRecord?.studentName} · {editingRecord?.groupName} (
                {editingRecord?.timeSlot})
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nouveau statut</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) =>
                    setEditStatus((v as AttendanceStatus) ?? 'present')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Présent</SelectItem>
                    <SelectItem value="retard">En retard</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="excuse">Excusé</SelectItem>
                    <SelectItem value="non_pointe">Non pointé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="att-justification" className="text-xs font-medium">
                  Justification de correction (obligatoire si modification)
                </Label>
                <Textarea
                  id="att-justification"
                  rows={3}
                  value={editJustificationReason}
                  onChange={(e) => setEditJustificationReason(e.target.value)}
                  placeholder="Ex: Certificat médical remis au secrétariat, erreur de scan QR..."
                />
              </div>

              {justificationsEnabled && (
                <div className="space-y-1.5">
                  <Label htmlFor="att-doc" className="text-xs font-medium">
                    Pièce justificative fictive (nom de fichier démo)
                  </Label>
                  <Input
                    id="att-doc"
                    value={editJustificationDoc}
                    onChange={(e) => setEditJustificationDoc(e.target.value)}
                    placeholder="certificat_medical_demo.pdf"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="att-note" className="text-xs font-medium">
                  Note interne
                </Label>
                <Input
                  id="att-note"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Commentaire sur la séance..."
                />
              </div>
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingRecord(null)}
              >
                Annuler
              </Button>
              <Button type="button" onClick={handleSaveEdit}>
                Enregistrer la correction
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Sheet détail QR */}
        <Sheet
          open={Boolean(detailQrLog)}
          onOpenChange={(open) => !open && setDetailQrLog(null)}
        >
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Détail du scan QR (Mode Démo)</SheetTitle>
              <SheetDescription>
                Traçabilité simulée de la tentative de pointage
              </SheetDescription>
            </SheetHeader>

            {detailQrLog && (
              <div className="space-y-4 py-4 text-sm">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-semibold">
                        Distinction Scan simulé vs Serveur
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {detailQrLog.verificationLabel}. Aucune signature
                        cryptographique ni horodatage serveur réel n&apos;existe
                        dans ce prototype frontend.
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Élève</dt>
                    <dd className="mt-0.5 font-medium">
                      {detailQrLog.studentName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Code élève</dt>
                    <dd className="mt-0.5 font-mono">
                      {detailQrLog.studentCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Séance</dt>
                    <dd className="mt-0.5 font-medium">
                      {detailQrLog.sessionTitle}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Professeur</dt>
                    <dd className="mt-0.5 font-medium">
                      {detailQrLog.teacherName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Horodatage</dt>
                    <dd className="mt-0.5 font-mono tabular-nums">
                      {detailQrLog.scannedAtLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Doublon détecté</dt>
                    <dd className="mt-0.5 font-medium">
                      {detailQrLog.duplicateDetected ? 'Oui (bloqué)' : 'Non'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Terminal / source</dt>
                    <dd className="mt-0.5">{detailQrLog.deviceLabel}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Message résultat</dt>
                    <dd className="mt-0.5 font-medium">
                      {detailQrLog.message}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Dialog confirmation actions en masse avec motif obligatoire */}
        <ConfirmDialog
          open={Boolean(bulkConfirm)}
          onOpenChange={(open) => !open && setBulkConfirm(null)}
          title={
            bulkConfirm
              ? `Appliquer « ${STATUS_META[bulkConfirm.status].label} » à ${bulkConfirm.ids.length} pointage(s)`
              : ''
          }
          description="Toute modification groupée sur une feuille d'appel nécessite un motif traçable."
          variant={
            bulkConfirm?.status === 'absent' ? 'destructive' : 'default'
          }
          requireReason
          reasonLabel="Justification obligatoire"
          reasonPlaceholder="Ex: Clôture administrative de fin de journée..."
          confirmLabel="Appliquer la modification"
          onConfirm={(reason) => {
            if (!bulkConfirm) return;
            bulkMarkAttendance(
              bulkConfirm.ids,
              bulkConfirm.status,
              reason,
              activeUser.fullName
            );
            bulkConfirm.clear();
            toast.success(
              `${bulkConfirm.ids.length} pointage(s) mis à jour (${STATUS_META[bulkConfirm.status].label}).`
            );
            setBulkConfirm(null);
          }}
        />

        {/* Dialog prévisualisation alerte absence famille (jamais vrai envoi) */}
        <Dialog
          open={Boolean(selectedAlert)}
          onOpenChange={(open) => !open && setAlertPreviewId(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Prévisualisation alerte famille (Démo)</DialogTitle>
              <DialogDescription>
                Aucun SMS, Email ou WhatsApp réel ne sera envoyé depuis le
                prototype.
              </DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="font-medium">
                    Destinataire : {selectedAlert.guardianName}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    « Bonjour, nous vous informons que {selectedAlert.studentName}{' '}
                    cumule {selectedAlert.consecutiveAbsences} absence(s)
                    récente(s) dans le groupe {selectedAlert.groupName}. Merci de
                    transmettre un justificatif depuis votre espace ou à
                    l&apos;accueil de {activeCenter.name}. »
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAlertPreviewId(null)}
              >
                Fermer
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!selectedAlert) return;
                  updateAlertStatus(selectedAlert.id, 'parent_prevenu_demo');
                  toast.success(
                    'Alerte enregistrée comme « Prévisualisé / simulé (démo) ».'
                  );
                  setAlertPreviewId(null);
                }}
              >
                Enregistrer simulation (démo)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog impression feuille d'appel */}
        <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Feuille d&apos;appel imprimable (Démo)</DialogTitle>
              <DialogDescription>
                {activeCenter.name} · {filteredRecords.length} ligne(s)
                sélectionnée(s)
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="p-2 font-medium">Élève</th>
                    <th className="p-2 font-medium">Groupe</th>
                    <th className="p-2 font-medium">Horaire</th>
                    <th className="p-2 font-medium">Statut</th>
                    <th className="p-2 font-medium">Signature / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2 font-medium">
                        {r.studentName}{' '}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ({r.studentCode})
                        </span>
                      </td>
                      <td className="p-2">{r.groupName}</td>
                      <td className="p-2 font-mono tabular-nums">
                        {r.timeSlot}
                      </td>
                      <td className="p-2">{STATUS_META[r.status].label}</td>
                      <td className="p-2 text-muted-foreground">
                        {r.justificationReason ?? r.checkInTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrintPreviewOpen(false)}
              >
                Fermer
              </Button>
              <Button
                type="button"
                onClick={() => {
                  window.print();
                  toast.success("Boîte d'impression du navigateur ouverte.");
                }}
                className="gap-1.5"
              >
                <FileCheck2 className="size-4" />
                Lancer l&apos;impression
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleGate>
  );
}
