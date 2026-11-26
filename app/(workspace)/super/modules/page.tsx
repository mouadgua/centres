'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Boxes, Layers, Search } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type { ModuleDefinition, ModuleGroup } from '@/types/core';

const GROUPS: ModuleGroup[] = [
  'Base',
  'Présences',
  'Parents',
  'Communication',
  'Finance',
  'Documents',
  'Données',
  'Calendrier',
  'Qualité',
  'Marque',
];

export default function SuperModulesCatalogPage() {
  const { centers } = useDemoSession();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedModule, setSelectedModule] =
    useState<ModuleDefinition | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_MODULES.filter((mod) => {
      if (groupFilter !== 'all' && mod.group !== groupFilter) return false;
      if (planFilter !== 'all' && mod.planRequirement !== planFilter)
        return false;
      if (!q) return true;
      return (
        mod.name.toLowerCase().includes(q) ||
        mod.key.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q)
      );
    });
  }, [search, groupFilter, planFilter]);

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Catalogue central de modules ({ALL_MODULES.length})
            </h1>
            <p className="text-sm text-muted-foreground">
              Référentiel typé des feature flags plateformes, dépendances et
              routes associées.
            </p>
          </div>
          <Link
            href="/super/instances"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ouvrir le configurateur d&apos;instances
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un module, une clé ou une description..."
              className="pl-8"
            />
          </div>
          <Select
            value={groupFilter}
            onValueChange={(v) => setGroupFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous domaines</SelectItem>
              {GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={planFilter}
            onValueChange={(v) => setPlanFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous plans</SelectItem>
              <SelectItem value="Essentiel">Essentiel</SelectItem>
              <SelectItem value="Plus">Plus</SelectItem>
              <SelectItem value="Tout-en-un">Tout-en-un</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mod) => {
            const activeInCount = centers.filter((c) =>
              c.enabledModules.includes(mod.key)
            ).length;
            return (
              <Card
                key={mod.key}
                className="flex flex-col justify-between border-border shadow-none"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm">{mod.name}</CardTitle>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {mod.key}
                      </p>
                    </div>
                    <Boxes className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p className="text-muted-foreground">{mod.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                    <span>
                      {mod.group} · Plan {mod.planRequirement} ·{' '}
                      {activeInCount}/{centers.length} centres
                    </span>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedModule(mod)}
                    >
                      Inspecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Sheet
          open={Boolean(selectedModule)}
          onOpenChange={(open) => {
            if (!open) setSelectedModule(null);
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-md">
            {selectedModule && (
              <>
                <SheetHeader className="pb-4">
                  <SheetTitle>{selectedModule.name}</SheetTitle>
                  <SheetDescription className="font-mono text-xs">
                    {selectedModule.key}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 px-4 text-sm">
                  <p className="text-muted-foreground">
                    {selectedModule.description}
                  </p>
                  <div className="space-y-2 rounded-xl border border-border p-3.5 text-xs">
                    <p>
                      Domaine : <strong>{selectedModule.group}</strong>
                    </p>
                    <p>
                      Plan indicatif :{' '}
                      <strong>{selectedModule.planRequirement}</strong>
                    </p>
                    <p>
                      Dépendances :{' '}
                      <span className="font-mono">
                        {selectedModule.dependencies.length > 0
                          ? selectedModule.dependencies.join(', ')
                          : 'Aucune'}
                      </span>
                    </p>
                    <p>
                      Rôles autorisés :{' '}
                      <strong>{selectedModule.rolesAllowed.join(', ')}</strong>
                    </p>
                    <p>
                      Routes UI impactées :{' '}
                      <span className="font-mono">
                        {selectedModule.uiRoutes.join(', ')}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5 text-xs">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <Layers className="size-3.5 text-primary" />
                      État par centre démo
                    </p>
                    {centers.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between"
                      >
                        <span>{c.name}</span>
                        <span
                          className={
                            c.enabledModules.includes(selectedModule.key)
                              ? 'font-medium text-success'
                              : 'text-muted-foreground'
                          }
                        >
                          {c.enabledModules.includes(selectedModule.key)
                            ? 'Activé'
                            : 'Désactivé'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ModuleGate>
  );
}
