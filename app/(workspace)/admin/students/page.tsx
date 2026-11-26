'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { DataTable, type BulkAction } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { StudentRecord } from '@/types/profiles';

function StudentsListInner() {
  const searchParams = useSearchParams();
  const initialOverdue = searchParams.get('filter') === 'overdue';

  const { activeCenter, hasModule } = useDemoSession();
  const {
    students,
    guardians,
    bulkUpdateStudentsStatus,
    bulkAssignStudentsGroup,
  } = useProfilesStore();

  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(initialOverdue);
  const [archiveConfirm, setArchiveConfirm] = useState<{
    rows: StudentRecord[];
    clear: () => void;
  } | null>(null);
  const [assignGroupDialog, setAssignGroupDialog] = useState<{
    rows: StudentRecord[];
    clear: () => void;
  } | null>(null);
  const [targetGroup, setTargetGroup] = useState('2Bac PC — Excellence');

  const levels = useMemo(
    () => Array.from(new Set(students.map((s) => s.level))),
    [students]
  );

  const filteredData = useMemo(() => {
    return students.filter((s) => {
      if (levelFilter !== 'all' && s.level !== levelFilter) return false;
      if (overdueOnly && s.balanceMad <= 0) return false;
      return true;
    });
  }, [students, levelFilter, overdueOnly]);

  const guardianMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of guardians) {
      map.set(g.id, `${g.firstName} ${g.lastName}`);
    }
    return map;
  }, [guardians]);

  const columns = useMemo<ColumnDef<StudentRecord>[]>(
    () => [
      {
        id: 'student',
        header: 'Élève',
        accessorFn: (r) => `${r.firstName} ${r.lastName} ${r.code}`,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {row.original.initials}
            </span>
            <div>
              <Link
                href={`/admin/students/${row.original.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {row.original.firstName} {row.original.lastName}
              </Link>
              <p className="font-mono text-[11px] text-muted-foreground">
                {row.original.code} · {row.original.siteName}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'level',
        header: 'Niveau & Groupes',
        cell: ({ row }) => (
          <div>
            <p className="text-xs font-medium">{row.original.level}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.groupNames.join(' · ') || 'Aucun groupe'}
            </p>
          </div>
        ),
      },
      {
        id: 'guardian',
        header: 'Responsable',
        accessorFn: (r) =>
          r.guardianIds.map((id) => guardianMap.get(id) ?? '').join(' '),
        cell: ({ row }) => {
          const names = row.original.guardianIds
            .map((id) => guardianMap.get(id))
            .filter(Boolean);
          return (
            <div>
              <p className="text-xs">{names[0] ?? 'Non rattaché'}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {row.original.phone}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const st = row.original.status;
          const cls =
            st === 'actif'
              ? 'text-success'
              : st === 'suspendu'
                ? 'text-warning'
                : 'text-muted-foreground';
          return (
            <span className={`text-xs font-medium capitalize ${cls}`}>
              {st}
            </span>
          );
        },
      },
      {
        accessorKey: 'balanceMad',
        header: 'Solde dû',
        cell: ({ row }) => (
          <span
            className={`font-mono text-xs font-semibold tabular-nums ${
              row.original.balanceMad > 0
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {formatMAD(row.original.balanceMad)}
          </span>
        ),
      },
      {
        accessorKey: 'attendanceRatePercent',
        header: 'Présence',
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-xs font-medium tabular-nums">
              {row.original.attendanceRatePercent} %
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.lastAttendanceLabel}
            </p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            href={`/admin/students/${row.original.id}`}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            Ouvrir fiche
          </Link>
        ),
      },
    ],
    [guardianMap]
  );

  const bulkActions: BulkAction<StudentRecord>[] = [
    {
      id: 'assign-group',
      label: 'Assigner groupe',
      onExecute: (rows, clear) => setAssignGroupDialog({ rows, clear }),
    },
    {
      id: 'export-demo',
      label: 'Exporter sélection (démo)',
      onExecute: (rows, clear) => {
        toast.info(`Export démo préparé pour ${rows.length} élève(s) fictifs`);
        clear();
      },
    },
    {
      id: 'archive',
      label: 'Archiver',
      variant: 'destructive',
      onExecute: (rows, clear) => setArchiveConfirm({ rows, clear }),
    },
  ];

  const totalActive = students.filter((s) => s.status === 'actif').length;
  const totalOverdueCount = students.filter((s) => s.balanceMad > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Élèves — {activeCenter.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Dossiers scolaires, rattachement parents, groupes et solde indicatif
            en MAD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasModule('exports') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                toast.info(
                  'Export CSV élèves simulé (contrôle serveur requis en prod)'
                )
              }
            >
              <Download className="size-3.5" />
              Exporter (démo)
            </Button>
          )}
          <Link
            href="/admin/students/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            Nouvel élève
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total fiches ({activeCenter.name})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {students.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Inscrits actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-success tabular-nums">
              {totalActive}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avec solde impayé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-destructive tabular-nums">
              {totalOverdueCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Rechercher nom, code ELV-, téléphone..."
        facetColumnId="status"
        facetOptions={[
          { value: 'actif', label: 'Actifs' },
          { value: 'suspendu', label: 'Suspendus' },
          { value: 'archive', label: 'Archivés' },
        ]}
        enableRowSelection
        bulkActions={bulkActions}
        toolbarExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={levelFilter}
              onValueChange={(v) => setLevelFilter(v ?? 'all')}
            >
              <SelectTrigger size="sm" className="w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous niveaux</SelectItem>
                {levels.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              variant={overdueOnly ? 'default' : 'outline'}
              onClick={() => setOverdueOnly((v) => !v)}
              className="h-8 text-xs"
            >
              Impayés uniquement
            </Button>
          </div>
        }
        renderMobileCard={(s, selected, toggle) => (
          <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={toggle}
                  aria-label={`Sélectionner ${s.firstName} ${s.lastName}`}
                />
                <Link
                  href={`/admin/students/${s.id}`}
                  className="font-semibold hover:text-primary"
                >
                  {s.firstName} {s.lastName}
                </Link>
              </div>
              <span className="text-xs capitalize text-muted-foreground">
                {s.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {s.level} · {s.groupNames.join(', ') || 'Sans groupe'}
            </p>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="font-mono text-muted-foreground tabular-nums">
                Solde : {formatMAD(s.balanceMad)}
              </span>
              <Link
                href={`/admin/students/${s.id}`}
                className="font-medium text-primary"
              >
                Fiche →
              </Link>
            </div>
          </div>
        )}
        emptyTitle="Aucun élève enregistré sur ce filtre"
        emptyDescription="Ajoutez un élève fictif ou réinitialisez les filtres de niveau et d'impayés."
      />

      <ConfirmDialog
        open={Boolean(archiveConfirm)}
        onOpenChange={(o) => {
          if (!o) setArchiveConfirm(null);
        }}
        variant="destructive"
        requireTypedText="ARCHIVER"
        title={`Archiver ${archiveConfirm?.rows.length ?? 0} élève(s) ?`}
        description="Les fiches resteront consultables dans l'onglet Archivés mais seront retirées des feuilles d'appel actives."
        consequences={
          archiveConfirm?.rows.map(
            (r) => `${r.firstName} ${r.lastName} (${r.code})`
          ) ?? []
        }
        confirmLabel="Archiver la sélection"
        onConfirm={() => {
          if (!archiveConfirm) return;
          bulkUpdateStudentsStatus(
            archiveConfirm.rows.map((r) => r.id),
            'archive'
          );
          archiveConfirm.clear();
          toast.success(
            `${archiveConfirm.rows.length} élève(s) archivé(s) en mode démo`
          );
          setArchiveConfirm(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(assignGroupDialog)}
        onOpenChange={(o) => {
          if (!o) setAssignGroupDialog(null);
        }}
        title={`Affecter ${assignGroupDialog?.rows.length ?? 0} élève(s) au groupe ?`}
        description={`Groupe cible : ${targetGroup}.`}
        consequences={[
          'Ajout du groupe sur les fiches sélectionnées (Mode Démo)',
          'Possibilité de changer ensuite depuis chaque fiche',
        ]}
        confirmLabel="Affecter maintenant"
        onConfirm={() => {
          if (!assignGroupDialog) return;
          bulkAssignStudentsGroup(
            assignGroupDialog.rows.map((r) => r.id),
            targetGroup
          );
          assignGroupDialog.clear();
          setTargetGroup('2Bac PC — Excellence');
          toast.success('Affectation groupée enregistrée');
          setAssignGroupDialog(null);
        }}
      />
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <ModuleGate moduleKey="students" allowedRoles={['director', 'secretary']}>
      <Suspense
        fallback={
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Users className="size-4" />
            Chargement de la liste élèves...
          </div>
        }
      >
        <StudentsListInner />
      </Suspense>
    </ModuleGate>
  );
}
