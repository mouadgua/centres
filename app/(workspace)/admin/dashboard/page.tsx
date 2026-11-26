'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate, CapabilityGate } from '@/components/feedback/module-gate';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { formatMAD, formatNumberFR } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';

type PeriodFilter = 'today' | '7d' | 'month';

const MONTHLY_REVENUE_SERIES = [
  { label: 'Juin', factor: 0.72 },
  { label: 'Juil', factor: 0.45 },
  { label: 'Août', factor: 0.31 },
  { label: 'Sept', factor: 0.88 },
  { label: 'Oct', factor: 0.96 },
  { label: 'Nov', factor: 1.0 },
];

const WEEKLY_ATTENDANCE_SERIES = [
  { day: 'Lun', rate: 95 },
  { day: 'Mar', rate: 93 },
  { day: 'Mer', rate: 91 },
  { day: 'Jeu', rate: 94 },
  { day: 'Ven', rate: 89 },
  { day: 'Sam', rate: 96 },
];

export default function AdminDashboardPage() {
  const { activeCenter, activeRole, hasModule } = useDemoSession();
  const { students, teachers } = useProfilesStore();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const [widgets, setWidgets] = useState({
    kpis: true,
    charts: true,
    sessions: true,
    payments: true,
    alerts: true,
  });

  const periodFactor = period === 'today' ? 0.08 : period === '7d' ? 0.32 : 1;
  const siteFactor =
    selectedSite === 'all'
      ? 1
      : 1 / Math.max(activeCenter.locations.length, 1);

  const activeStudentsLiveDelta = Math.max(
    0,
    students.filter((s) => s.status === 'actif').length - 2
  );

  const computedMetrics = useMemo(() => {
    const m = activeCenter.metrics;
    const overdueFromProfiles = students.reduce(
      (s, st) => s + (st.balanceMad > 0 ? st.balanceMad : 0),
      0
    );
    return {
      activeStudents: Math.round(
        (m.activeStudents + activeStudentsLiveDelta) * siteFactor
      ),
      newEnrollments: Math.max(
        1,
        Math.round(m.newEnrollmentsMonth * periodFactor * siteFactor)
      ),
      todaySessions: Math.max(
        1,
        Math.round(m.todaySessionsCount * siteFactor)
      ),
      attendanceRate: m.attendanceRatePercent,
      absencesToday: Math.max(0, Math.round(m.absencesToday * siteFactor)),
      collectedRevenue: Math.round(
        m.collectedRevenueMad * periodFactor * siteFactor
      ),
      pendingReceivables: Math.round(m.pendingReceivablesMad * siteFactor),
      overdueAmount: Math.round(
        Math.max(m.overdueAmountMad, overdueFromProfiles) * siteFactor
      ),
      estimatedPayroll: Math.round(
        m.estimatedPayrollMad * periodFactor * siteFactor
      ),
    };
  }, [
    activeCenter.metrics,
    activeStudentsLiveDelta,
    periodFactor,
    siteFactor,
    students,
  ]);

  const filteredSessions = useMemo(() => {
    if (selectedSite === 'all') return activeCenter.todaySessions;
    const siteObj = activeCenter.locations.find((l) => l.id === selectedSite);
    if (!siteObj) return activeCenter.todaySessions;
    return activeCenter.todaySessions.filter(
      (s) => s.siteName === siteObj.name
    );
  }, [activeCenter.todaySessions, activeCenter.locations, selectedSite]);

  const studentsWithBalance = useMemo(
    () => students.filter((s) => s.balanceMad > 0),
    [students]
  );

  const canViewFinance =
    activeRole === 'director' || activeRole === 'accountant';

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Indicateurs démo actualisés');
    }, 350);
  };

  const handleExportDemoSummary = () => {
    const summary = {
      mode: 'PROTOTYPE_DEMO_FICTIF',
      centre: activeCenter.name,
      ville: activeCenter.city,
      periode: period,
      indicateurs: computedMetrics,
      eleves_liste_count: students.length,
      professeurs_count: teachers.length,
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthese-${activeCenter.branding.shortCode.toLowerCase()}-demo.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Synthèse démo téléchargée (données fictives)');
  };

  return (
    <ModuleGate allowedRoles={['director', 'secretary', 'accountant']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Vue d&apos;ensemble — {activeCenter.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.city} · Plan {activeCenter.plan} ·{' '}
              {activeCenter.locations.length} site(s) · Données démo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period segmented control */}
            <div
              role="group"
              aria-label="Période d'analyse"
              className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5"
            >
              {(
                [
                  { id: 'today', label: "Aujourd'hui" },
                  { id: '7d', label: '7 jours' },
                  { id: 'month', label: 'Ce mois' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeriod(opt.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                    period === opt.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Site filter */}
            {activeCenter.locations.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                    />
                  }
                >
                  <Building2 className="size-3.5 text-muted-foreground" />
                  <span>
                    {selectedSite === 'all'
                      ? 'Tous les sites'
                      : activeCenter.locations.find((l) => l.id === selectedSite)
                          ?.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedSite('all')}>
                    Tous les sites
                  </DropdownMenuItem>
                  {activeCenter.locations.map((loc) => (
                    <DropdownMenuItem
                      key={loc.id}
                      onClick={() => setSelectedSite(loc.id)}
                    >
                      {loc.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomizeOpen(true)}
              className="gap-1.5 text-xs"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Personnaliser</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={handleExportDemoSummary}
              aria-label="Exporter synthèse démo"
            >
              <Download className="size-3.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={handleRefresh}
              aria-label="Actualiser les données démo"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </Button>

            {/* Quick action menu filtered by module capabilities */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" size="sm" className="gap-1.5">
                    <Plus className="size-3.5" />
                    Action rapide
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                {hasModule('students') && activeRole !== 'accountant' && (
                  <DropdownMenuItem render={<Link href="/admin/students/new" />}>
                    Nouvel élève
                  </DropdownMenuItem>
                )}
                {hasModule('guardians') && activeRole !== 'accountant' && (
                  <DropdownMenuItem render={<Link href="/admin/guardians" />}>
                    Parents &amp; responsables
                  </DropdownMenuItem>
                )}
                {hasModule('teachers') && activeRole !== 'accountant' && (
                  <DropdownMenuItem render={<Link href="/admin/teachers" />}>
                    Équipe professeurs
                  </DropdownMenuItem>
                )}
                {hasModule('sessions') && activeRole !== 'accountant' && (
                  <DropdownMenuItem render={<Link href="/admin/sessions" />}>
                    Planifier une séance (Lot 5)
                  </DropdownMenuItem>
                )}
                {hasModule('billing') && (
                  <DropdownMenuItem render={<Link href="/admin/payments" />}>
                    Enregistrer un paiement (Lot 8)
                  </DropdownMenuItem>
                )}
                {hasModule('dataStudio') && (
                  <DropdownMenuItem render={<Link href="/admin/data-studio" />}>
                    Studio de données (Lot 9)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* KPI Grid */}
        {widgets.kpis && (
          <section
            aria-label="Indicateurs clés"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <CapabilityGate moduleKey="students">
              <Link href="/admin/students" className="group block">
                <Card className="h-full border-border shadow-none transition-colors group-hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-xs font-medium">
                      Élèves actifs
                    </CardDescription>
                    <Users className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-2xl font-semibold tabular-nums">
                      {formatNumberFR(computedMetrics.activeStudents)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium text-success">
                        +{computedMetrics.newEnrollments}
                      </span>
                      <span>inscriptions · {students.length} fiches récentes</span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </CapabilityGate>

            <CapabilityGate moduleKey="attendance.manual">
              <Link href="/admin/attendance" className="group block">
                <Card className="h-full border-border shadow-none transition-colors group-hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-xs font-medium">
                      Taux de présence
                    </CardDescription>
                    <CheckCircle2 className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-2xl font-semibold tabular-nums">
                      {computedMetrics.attendanceRate} %
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {computedMetrics.absencesToday} absence(s) aujourd&apos;hui ·{' '}
                      {computedMetrics.todaySessions} séances
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </CapabilityGate>

            {canViewFinance && (
              <CapabilityGate moduleKey="billing">
                <Link href="/admin/payments" className="group block">
                  <Card className="h-full border-border shadow-none transition-colors group-hover:border-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription className="text-xs font-medium">
                        Revenus encaissés
                      </CardDescription>
                      <Wallet className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="font-mono text-2xl font-semibold tabular-nums">
                        {formatMAD(computedMetrics.collectedRevenue)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        À recevoir : {formatMAD(computedMetrics.pendingReceivables)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </CapabilityGate>
            )}

            {canViewFinance && (
              <CapabilityGate moduleKey="dues">
                <Link
                  href="/admin/students?filter=overdue"
                  className="group block"
                >
                  <Card className="h-full border-border shadow-none transition-colors group-hover:border-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription className="text-xs font-medium">
                        Impayés en retard
                      </CardDescription>
                      <CalendarClock className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="font-mono text-2xl font-semibold text-destructive tabular-nums">
                        {formatMAD(computedMetrics.overdueAmount)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {studentsWithBalance.length} dossier(s) avec solde dû
                        {hasModule('payroll')
                          ? ` · Paie : ${formatMAD(computedMetrics.estimatedPayroll)}`
                          : ''}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </CapabilityGate>
            )}
          </section>
        )}

        {/* Lightweight Visual Analytics Row */}
        {widgets.charts && (
          <div className="grid gap-6 lg:grid-cols-2">
            {canViewFinance && hasModule('billing') && (
              <Card className="border-border shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="size-4 text-primary" />
                      Encaissements mensuels (MAD)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Données démo sur 6 mois glissants
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex h-36 items-end justify-between gap-2">
                    {MONTHLY_REVENUE_SERIES.map((bar) => {
                      const val = Math.round(
                        activeCenter.metrics.collectedRevenueMad *
                          bar.factor *
                          siteFactor
                      );
                      const pct = Math.max(12, Math.round(bar.factor * 100));
                      return (
                        <div
                          key={bar.label}
                          className="flex flex-1 flex-col items-center gap-1.5"
                        >
                          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                            {Math.round(val / 1000)}k
                          </span>
                          <div className="flex h-24 w-full items-end rounded-md bg-muted/40 p-1">
                            <div
                              className="w-full rounded-sm bg-primary transition-all"
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {bar.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <CapabilityGate moduleKey="attendance.manual">
              <Card className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Assiduité hebdomadaire par jour
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Données démo · Taux moyen {computedMetrics.attendanceRate} %
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-2">
                  {WEEKLY_ATTENDANCE_SERIES.map((d) => (
                    <div key={d.day} className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-medium text-muted-foreground">
                        {d.day}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-success"
                          style={{ width: `${d.rate}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono tabular-nums">
                        {d.rate} %
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </CapabilityGate>
          </div>
        )}

        {/* Operational Widgets Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {widgets.sessions && (
            <CapabilityGate moduleKey="sessions">
              <Card className="border-border shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Séances du jour</CardTitle>
                    <CardDescription className="text-xs">
                      Créneaux planifiés sur {activeCenter.name}
                    </CardDescription>
                  </div>
                  <Link
                    href="/admin/sessions"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Tout voir
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {filteredSessions.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Aucune séance trouvée pour le site sélectionné.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredSessions.map((ses) => (
                        <div
                          key={ses.id}
                          className="flex flex-col justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {ses.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {ses.teacherName} · {ses.roomName} ({ses.siteName})
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-1 font-mono text-muted-foreground tabular-nums">
                              <Clock className="size-3.5" />
                              {ses.startTime}–{ses.endTime}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {ses.presentStudents}/{ses.expectedStudents}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CapabilityGate>
          )}

          {widgets.payments && canViewFinance && hasModule('billing') ? (
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Derniers encaissements (démo)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Écritures fictives en dirhams marocains (MAD)
                  </CardDescription>
                </div>
                <Link
                  href="/admin/payments"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Encaissements
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {activeCenter.recentPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {pay.studentName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {pay.reference} · {pay.method} · {pay.dateLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold tabular-nums">
                          {formatMAD(pay.amountMad)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {pay.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Administrative Reminders & Profiles Quick Access */}
        {widgets.alerts && (
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="size-4 text-warning" />
                Rappels administratifs &amp; dossiers à suivre
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 text-xs">
              <Link
                href="/admin/students?filter=overdue"
                className="rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/40"
              >
                <p className="font-semibold text-foreground">
                  {studentsWithBalance.length} élève(s) avec solde dû
                </p>
                <p className="mt-1 text-muted-foreground">
                  Ouvrir la liste filtrée des dossiers à régulariser.
                </p>
              </Link>
              <Link
                href="/admin/guardians"
                className="rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/40"
              >
                <p className="font-semibold text-foreground">
                  Vérifier doublons &amp; consentements
                </p>
                <p className="mt-1 text-muted-foreground">
                  Contrôler les responsables financiers et préférences FR/AR.
                </p>
              </Link>
              <Link
                href="/admin/teachers"
                className="rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/40"
              >
                <p className="font-semibold text-foreground">
                  {teachers.length} professeur(s) actif(s) sur {activeCenter.name}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Consulter les disponibilités et estimations de paie.
                </p>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customize Dashboard Sheet */}
      <Sheet open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader className="pb-4">
            <SheetTitle>Personnaliser le dashboard</SheetTitle>
            <SheetDescription className="text-xs">
              Affichez ou masquez les blocs opérationnels selon vos priorités.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 text-sm">
            {(
              [
                { key: 'kpis', label: 'Cartes KPI principales' },
                { key: 'charts', label: 'Graphiques encaissements & assiduité' },
                { key: 'sessions', label: 'Widget Séances du jour' },
                { key: 'payments', label: 'Widget Derniers encaissements' },
                { key: 'alerts', label: 'Rappels administratifs' },
              ] as const
            ).map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <span>{item.label}</span>
                <Switch
                  checked={widgets[item.key]}
                  onCheckedChange={(v) =>
                    setWidgets((prev) => ({ ...prev, [item.key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </ModuleGate>
  );
}
