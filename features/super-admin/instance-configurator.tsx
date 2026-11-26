'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  Info,
  Layers,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import { PRESET_MODULES } from '@/lib/mock-api/super-admin-data';
import { getFilteredNavGroups } from '@/lib/permissions/navigation';
import { getActiveOnboardingSteps } from '@/features/onboarding-wizard/onboarding-config';
import { useDemoSession } from '@/stores/demo-session-context';
import type {
  ModuleDefinition,
  ModuleGroup,
  ModuleKey,
  PlanTier,
} from '@/types/core';

const MODULE_GROUPS: ModuleGroup[] = [
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

function collectTransitiveDependencies(
  targetKey: ModuleKey,
  currentModules: ModuleKey[]
): ModuleKey[] {
  const missing: ModuleKey[] = [];
  const visited = new Set<ModuleKey>();

  const walk = (key: ModuleKey) => {
    const def = ALL_MODULES.find((m) => m.key === key);
    if (!def) return;
    for (const dep of def.dependencies) {
      if (!visited.has(dep)) {
        visited.add(dep);
        walk(dep);
        if (!currentModules.includes(dep) && !missing.includes(dep)) {
          missing.push(dep);
        }
      }
    }
  };

  walk(targetKey);
  return missing;
}

function collectReverseDependents(
  targetKey: ModuleKey,
  currentModules: ModuleKey[]
): ModuleKey[] {
  const affected: ModuleKey[] = [];
  const queue: ModuleKey[] = [targetKey];
  const seen = new Set<ModuleKey>([targetKey]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const mod of ALL_MODULES) {
      if (
        currentModules.includes(mod.key) &&
        mod.dependencies.includes(current) &&
        !seen.has(mod.key)
      ) {
        seen.add(mod.key);
        affected.push(mod.key);
        queue.push(mod.key);
      }
    }
  }

  return affected;
}

export function InstanceConfigurator({
  fixedCenterId,
}: {
  fixedCenterId?: string;
}) {
  const {
    centers,
    activeCenter,
    setCenterModules,
    switchCenter,
    switchRole,
  } = useDemoSession();

  const [selectedCenterId, setSelectedCenterId] = useState<string>(
    fixedCenterId ?? activeCenter.id
  );
  const effectiveCenterId = fixedCenterId ?? selectedCenterId;

  const targetCenter = useMemo(
    () => centers.find((c) => c.id === effectiveCenterId) ?? centers[0],
    [centers, effectiveCenterId]
  );

  // Store local working draft per center id so switching center preserves clean state
  const [draftByCenter, setDraftByCenter] = useState<
    Record<string, { modules: ModuleKey[]; plan: PlanTier }>
  >({});
  const [lastSnapshotByCenter, setLastSnapshotByCenter] = useState<
    Record<string, { modules: ModuleKey[]; plan: PlanTier }>
  >({});

  const workingModules =
    draftByCenter[targetCenter.id]?.modules ?? targetCenter.enabledModules;
  const workingPlan = draftByCenter[targetCenter.id]?.plan ?? targetCenter.plan;

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<
    'all' | 'enabled' | 'disabled'
  >('all');
  const [inspectModule, setInspectModule] = useState<ModuleDefinition | null>(
    null
  );

  // Dependency confirmation dialog state
  const [pendingDepAction, setPendingDepAction] = useState<{
    mode: 'enable' | 'disable';
    target: ModuleDefinition;
    chain: ModuleKey[];
  } | null>(null);

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const setDraftForTarget = (modules: ModuleKey[], plan: PlanTier) => {
    setDraftByCenter((prev) => ({
      ...prev,
      [targetCenter.id]: { modules: Array.from(new Set(modules)), plan },
    }));
  };

  const diffAdded = useMemo(
    () =>
      workingModules.filter((k) => !targetCenter.enabledModules.includes(k)),
    [workingModules, targetCenter.enabledModules]
  );
  const diffRemoved = useMemo(
    () =>
      targetCenter.enabledModules.filter((k) => !workingModules.includes(k)),
    [workingModules, targetCenter.enabledModules]
  );
  const hasUnsavedChanges =
    diffAdded.length > 0 ||
    diffRemoved.length > 0 ||
    workingPlan !== targetCenter.plan;

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_MODULES.filter((mod) => {
      if (groupFilter !== 'all' && mod.group !== groupFilter) return false;
      const isEnabled = workingModules.includes(mod.key);
      if (stateFilter === 'enabled' && !isEnabled) return false;
      if (stateFilter === 'disabled' && isEnabled) return false;
      if (!q) return true;
      return (
        mod.name.toLowerCase().includes(q) ||
        mod.key.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q)
      );
    });
  }, [search, groupFilter, stateFilter, workingModules]);

  const handleToggleSwitch = (mod: ModuleDefinition, nextChecked: boolean) => {
    if (nextChecked) {
      const missingDeps = collectTransitiveDependencies(
        mod.key,
        workingModules
      );
      if (missingDeps.length > 0) {
        // Never silently activate dependencies: ask explicit user confirmation
        setPendingDepAction({
          mode: 'enable',
          target: mod,
          chain: missingDeps,
        });
        return;
      }
      setDraftForTarget([...workingModules, mod.key], 'Sur mesure');
    } else {
      const dependents = collectReverseDependents(mod.key, workingModules);
      if (dependents.length > 0) {
        setPendingDepAction({
          mode: 'disable',
          target: mod,
          chain: dependents,
        });
        return;
      }
      setDraftForTarget(
        workingModules.filter((k) => k !== mod.key),
        'Sur mesure'
      );
    }
  };

  const handleConfirmDepAction = () => {
    if (!pendingDepAction) return;
    if (pendingDepAction.mode === 'enable') {
      setDraftForTarget(
        [
          ...workingModules,
          ...pendingDepAction.chain,
          pendingDepAction.target.key,
        ],
        'Sur mesure'
      );
      toast.info(
        `${pendingDepAction.target.name} et ${pendingDepAction.chain.length} dépendance(s) ajoutés au brouillon`
      );
    } else {
      const toRemove = new Set([
        pendingDepAction.target.key,
        ...pendingDepAction.chain,
      ]);
      setDraftForTarget(
        workingModules.filter((k) => !toRemove.has(k)),
        'Sur mesure'
      );
      toast.info(
        `${pendingDepAction.target.name} et ${pendingDepAction.chain.length} module(s) dépendant(s) retirés du brouillon`
      );
    }
    setPendingDepAction(null);
  };

  const applyPreset = (tier: Exclude<PlanTier, 'Sur mesure'>) => {
    setDraftForTarget(PRESET_MODULES[tier], tier);
    toast.info(
      `Preset « ${tier} » chargé dans le brouillon (${PRESET_MODULES[tier].length} modules)`
    );
  };

  const handleApplyConfiguration = () => {
    setLastSnapshotByCenter((prev) => ({
      ...prev,
      [targetCenter.id]: {
        modules: targetCenter.enabledModules,
        plan: targetCenter.plan,
      },
    }));
    setCenterModules(targetCenter.id, workingModules, workingPlan);
    setDraftByCenter((prev) => {
      const next = { ...prev };
      delete next[targetCenter.id];
      return next;
    });
    setApplyDialogOpen(false);
    toast.success(`Configuration appliquée à ${targetCenter.name}`, {
      description: `${workingModules.length} modules actifs (${workingPlan}). Aucune donnée existante supprimée.`,
    });
  };

  const handleRollbackSnapshot = () => {
    const snap = lastSnapshotByCenter[targetCenter.id];
    if (!snap) return;
    setCenterModules(targetCenter.id, snap.modules, snap.plan);
    setDraftByCenter((prev) => {
      const next = { ...prev };
      delete next[targetCenter.id];
      return next;
    });
    toast.info(`Instantané précédent restauré pour ${targetCenter.name}`);
  };

  const directorPreviewGroups = useMemo(
    () => getFilteredNavGroups('director', workingModules),
    [workingModules]
  );
  const directorNavItemsCount = useMemo(
    () =>
      directorPreviewGroups.reduce((sum, g) => sum + g.items.length, 0),
    [directorPreviewGroups]
  );
  const onboardingPreviewCount = useMemo(
    () => getActiveOnboardingSteps(workingModules).length,
    [workingModules]
  );

  return (
    <div className="space-y-6">
      {/* Header & Center + Preset Controls */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Configurateur d&apos;instance — {targetCenter.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Activez ou désactivez les 57 capacités modulaires par centre. Toute
            modification met à jour la barre latérale, les routes et
            l&apos;onboarding en mode démo.
          </p>
        </div>

        {!fixedCenterId && (
          <div className="w-full sm:w-72">
            <Select
              value={targetCenter.id}
              onValueChange={(val) => {
                if (val) setSelectedCenterId(val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {centers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.plan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Presets & Action Bar */}
      <Card className="border-border shadow-none">
        <CardContent className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              Presets de plan :
            </span>
            {(['Essentiel', 'Plus', 'Tout-en-un'] as const).map((tier) => (
              <Button
                key={tier}
                type="button"
                size="sm"
                variant={workingPlan === tier ? 'default' : 'outline'}
                onClick={() => applyPreset(tier)}
              >
                {tier} ({PRESET_MODULES[tier].length})
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lastSnapshotByCenter[targetCenter.id] && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRollbackSnapshot}
                className="gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Restaurer instantané
              </Button>
            )}
            {hasUnsavedChanges && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setDraftByCenter((prev) => {
                    const next = { ...prev };
                    delete next[targetCenter.id];
                    return next;
                  })
                }
              >
                Annuler brouillon
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={!hasUnsavedChanges}
              onClick={() => setApplyDialogOpen(true)}
              className="gap-1.5"
            >
              <Save className="size-3.5" />
              Appliquer la configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left: Searchable & Filterable Module Matrix */}
        <div className="space-y-4 xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer par nom, clé technique (ex. billing, qr)..."
                className="h-9 pl-8 text-sm"
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
                <SelectItem value="all">Tous domaines (10)</SelectItem>
                {MODULE_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stateFilter}
              onValueChange={(v) =>
                setStateFilter((v as 'all' | 'enabled' | 'disabled') ?? 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous états</SelectItem>
                <SelectItem value="enabled">Inclus ({workingModules.length})</SelectItem>
                <SelectItem value="disabled">
                  Désactivés ({ALL_MODULES.length - workingModules.length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {filteredModules.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Aucun module ne correspond à votre filtre.
              </div>
            ) : (
              filteredModules.map((mod) => {
                const enabled = workingModules.includes(mod.key);
                const changed =
                  enabled !== targetCenter.enabledModules.includes(mod.key);
                return (
                  <div
                    key={mod.key}
                    className={cn(
                      'flex items-start justify-between gap-4 p-4 transition-colors',
                      changed && 'bg-primary/5'
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {mod.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {mod.key}
                        </span>
                        {mod.status === 'bêta' && (
                          <span className="text-[11px] font-medium text-warning">
                            · Bêta
                          </span>
                        )}
                        {changed && (
                          <span className="text-[11px] font-medium text-primary">
                            · Modifié
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mod.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>Domaine : {mod.group}</span>
                        <span>· Plan indicatif : {mod.planRequirement}</span>
                        {mod.dependencies.length > 0 && (
                          <span>
                            · Dépend de : {mod.dependencies.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 pt-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Détails de ${mod.name}`}
                        onClick={() => setInspectModule(mod)}
                      >
                        <Info className="size-4 text-muted-foreground" />
                      </Button>
                      <Switch
                        checked={enabled}
                        aria-label={`Activer ${mod.name}`}
                        onCheckedChange={(checked) =>
                          handleToggleSwitch(mod, checked)
                        }
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Impact & Diff Preview */}
        <aside className="space-y-4 xl:col-span-4">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <SlidersHorizontal className="size-4 text-primary" />
                Impact en direct sur {targetCenter.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Plan cible : <strong>{workingPlan}</strong> ·{' '}
                <span className="font-mono tabular-nums">
                  {workingModules.length} / {ALL_MODULES.length}
                </span>{' '}
                modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {hasUnsavedChanges ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                  <p className="font-semibold text-foreground">
                    Modifications en attente
                  </p>
                  {diffAdded.length > 0 && (
                    <p className="text-success">
                      + {diffAdded.length} module(s) activé(s) :{' '}
                      {diffAdded.slice(0, 4).join(', ')}
                      {diffAdded.length > 4 ? '…' : ''}
                    </p>
                  )}
                  {diffRemoved.length > 0 && (
                    <p className="text-destructive">
                      - {diffRemoved.length} module(s) désactivé(s) :{' '}
                      {diffRemoved.slice(0, 4).join(', ')}
                      {diffRemoved.length > 4 ? '…' : ''}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                  <span>Configuration alignée avec l&apos;instance active.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">
                    Menus Directeur
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {directorNavItemsCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">
                    Étapes Onboarding
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {onboardingPreviewCount} / 17
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Eye className="size-3.5 text-primary" />
                  Aperçu sidebar Directeur résultante
                </p>
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {directorPreviewGroups.map((group) => (
                    <div key={group.id} className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {group.items.map((i) => i.label).join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <Link
                  href="/admin/dashboard"
                  onClick={() => {
                    switchCenter(targetCenter.id);
                    switchRole('director');
                  }}
                  className="inline-flex h-8 items-center justify-between rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" />
                    Ouvrir en Directeur
                  </span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => switchCenter(targetCenter.id)}
                  className="inline-flex h-8 items-center justify-between rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
                >
                  <span className="flex items-center gap-1.5">
                    <Compass className="size-3.5" />
                    Tester l&apos;onboarding de ce centre
                  </span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Module Detail Sheet */}
      <Sheet
        open={Boolean(inspectModule)}
        onOpenChange={(open) => {
          if (!open) setInspectModule(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {inspectModule && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle>{inspectModule.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {inspectModule.key} · {inspectModule.group}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6 text-sm">
                <p className="text-muted-foreground">
                  {inspectModule.description}
                </p>
                <div className="space-y-2 rounded-xl border border-border p-3.5 text-xs">
                  <p>
                    <span className="text-muted-foreground">Plan requis : </span>
                    <span className="font-medium">
                      {inspectModule.planRequirement}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Statut : </span>
                    <span className="font-medium">{inspectModule.status}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Rôles autorisés :{' '}
                    </span>
                    <span className="font-medium">
                      {inspectModule.rolesAllowed.join(', ')}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Routes UI : </span>
                    <span className="font-mono">
                      {inspectModule.uiRoutes.join(', ')}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Dépendances :{' '}
                    </span>
                    <span className="font-mono">
                      {inspectModule.dependencies.length > 0
                        ? inspectModule.dependencies.join(', ')
                        : 'Aucune'}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" />
                    Note d&apos;isolation
                  </p>
                  <p className="mt-1">
                    Si ce module est désactivé, ses menus, boutons d&apos;action
                    et étapes d&apos;onboarding disparaissent côté UI ; l&apos;accès
                    direct par URL affiche l&apos;écran ModuleGate sans fuite de
                    données.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dependency Confirmation Dialog (no silent dependency activation!) */}
      <ConfirmDialog
        open={Boolean(pendingDepAction)}
        onOpenChange={(open) => {
          if (!open) setPendingDepAction(null);
        }}
        variant={pendingDepAction?.mode === 'disable' ? 'destructive' : 'default'}
        title={
          pendingDepAction?.mode === 'enable'
            ? `Activer les dépendances de « ${pendingDepAction.target.name} » ?`
            : `Désactiver les modules liés à « ${pendingDepAction?.target.name} » ?`
        }
        description={
          pendingDepAction?.mode === 'enable'
            ? 'Aucune dépendance n’est activée silencieusement. Confirmez pour ajouter également les prérequis nécessaires au brouillon :'
            : 'D’autres modules actifs dépendent de cette capacité. Confirmez pour les retirer ensemble du brouillon (aucune donnée supprimée) :'
        }
        consequences={
          pendingDepAction?.chain.map((depKey) => {
            const meta = ALL_MODULES.find((m) => m.key === depKey);
            return `${meta?.name ?? depKey} (${depKey})`;
          }) ?? []
        }
        confirmLabel={
          pendingDepAction?.mode === 'enable'
            ? 'Activer la chaîne'
            : 'Désactiver ensemble'
        }
        onConfirm={handleConfirmDepAction}
      />

      {/* Apply Configuration Confirm Dialog */}
      <ConfirmDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        title={`Appliquer la configuration à ${targetCenter.name} ?`}
        description="Les menus, routes accessibles et étapes d’onboarding seront immédiatement recalculés pour ce centre."
        consequences={[
          `${diffAdded.length} module(s) nouvellement activé(s)`,
          `${diffRemoved.length} module(s) désactivé(s) (données simulées conservées sans suppression)`,
          `Plan résultant : ${workingPlan} (${workingModules.length} modules actifs)`,
        ]}
        confirmLabel="Appliquer maintenant"
        onConfirm={handleApplyConfiguration}
      />
    </div>
  );
}
