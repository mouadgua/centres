'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2, Plus, SlidersHorizontal } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import { DataTable } from '@/components/tables/data-table';
import { formatMAD, formatNumberFR } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import type { CenterInstance } from '@/types/core';

export default function SuperCentersListPage() {
  const { centers } = useDemoSession();

  const columns = useMemo<ColumnDef<CenterInstance>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Centre',
        cell: ({ row }) => (
          <div>
            <Link
              href={`/super/centers/${row.original.id}`}
              className="font-medium text-foreground hover:text-primary hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {row.original.city} · {row.original.branding.subdomain}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'plan',
        header: 'Plan',
        cell: ({ row }) => (
          <span className="text-xs font-medium">{row.original.plan}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const st = row.original.status;
          const color =
            st === 'actif'
              ? 'text-success'
              : st === 'essai'
                ? 'text-warning'
                : 'text-destructive';
          return (
            <span className={`text-xs font-medium capitalize ${color}`}>
              {st}
            </span>
          );
        },
      },
      {
        id: 'modulesCount',
        header: 'Modules actifs',
        accessorFn: (row) => row.enabledModules.length,
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums">
            {row.original.enabledModules.length} / 57
          </span>
        ),
      },
      {
        id: 'studentsCount',
        header: 'Volume élèves (agrégé)',
        accessorFn: (row) => row.metrics.activeStudents,
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums">
            {formatNumberFR(row.original.metrics.activeStudents)}
          </span>
        ),
      },
      {
        id: 'revenueAgg',
        header: 'Activité MAD (agrégée)',
        accessorFn: (row) => row.metrics.collectedRevenueMad,
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums">
            {formatMAD(row.original.metrics.collectedRevenueMad)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/super/centers/${row.original.id}`}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              Fiche
            </Link>
            <Link
              href={`/super/centers/${row.original.id}/configuration`}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              <SlidersHorizontal className="size-3" />
              Modules
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Centres &amp; Instances ({centers.length})
            </h1>
            <p className="text-sm text-muted-foreground">
              Compteurs agrégés uniquement — aucune donnée nominative
              d&apos;élève accessible depuis le Super Admin.
            </p>
          </div>
          <Link
            href="/super/centers/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            Nouveau centre démo
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={centers}
          searchPlaceholder="Rechercher un centre, une ville, un domaine..."
          facetColumnId="status"
          facetOptions={[
            { value: 'actif', label: 'Actifs' },
            { value: 'essai', label: 'En essai' },
            { value: 'suspendu', label: 'Suspendus' },
          ]}
          renderMobileCard={(c) => (
            <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Building2 className="size-4 text-primary" />
                  {c.name}
                </span>
                <span className="text-xs capitalize text-muted-foreground">
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {c.city} · Plan {c.plan} · {c.enabledModules.length} modules
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/super/centers/${c.id}`}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium"
                >
                  Détails
                </Link>
                <Link
                  href={`/super/centers/${c.id}/configuration`}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium"
                >
                  Configurer modules
                </Link>
              </div>
            </div>
          )}
        />
      </div>
    </ModuleGate>
  );
}
