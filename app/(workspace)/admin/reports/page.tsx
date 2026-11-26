'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3, BookmarkPlus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { GlobalBanner } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { downloadSafeCsv } from '@/lib/format/csv';
import { formatMAD } from '@/lib/format/morocco';
import { useAttendanceStore } from '@/stores/attendance-context';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';

export default function AdminReportsPage() {
  const { activeCenter } = useDemoSession();
  const { payments, dues, payroll, expenses } = useFinanceStore();
  const { sites, enrollments } = usePedagogyStore();
  const { students } = useProfilesStore();
  const { records: attendanceRecords } = useAttendanceStore();

  const [siteFilter, setSiteFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('Novembre 2026');
  const [savedViews, setSavedViews] = useState<string[]>([
    'Synthèse Direction — Novembre 2026',
  ]);

  const metrics = useMemo(() => {
    const collected = payments
      .filter((p) => p.status === 'encaisse' || p.status === 'partiel')
      .reduce((acc, p) => acc + p.amountMad, 0);
    const overdue = dues.reduce((acc, d) => acc + d.remainingMad, 0);
    const payrollSum = payroll.reduce((acc, p) => acc + p.netPayableMad, 0);
    const expensesSum = expenses
      .filter((e) => e.status !== 'archivee')
      .reduce((acc, e) => acc + e.amountMad, 0);
    const cashFlowIndicative = collected - payrollSum - expensesSum;

    const methodBreakdown = ['Espèces', 'Virement', 'Chèque', 'TPE / Carte (démo)'].map(
      (m) => ({
        method: m,
        amount: payments
          .filter(
            (p) =>
              p.method === m &&
              (p.status === 'encaisse' || p.status === 'partiel')
          )
          .reduce((acc, p) => acc + p.amountMad, 0),
      })
    );

    const markedAtt = attendanceRecords.filter((r) => r.status !== 'non_pointe');
    const presentAtt = markedAtt.filter(
      (r) => r.status === 'present' || r.status === 'retard'
    );
    const attendanceRate =
      markedAtt.length > 0
        ? Math.round((presentAtt.length / markedAtt.length) * 100)
        : 92;

    return {
      collected,
      overdue,
      payrollSum,
      expensesSum,
      cashFlowIndicative,
      methodBreakdown,
      attendanceRate,
      activeStudents: students.filter((s) => s.status === 'actif').length,
      activeEnrollments: enrollments.filter((e) => e.status === 'active').length,
    };
  }, [
    payments,
    dues,
    payroll,
    expenses,
    attendanceRecords,
    students,
    enrollments,
  ]);

  const nMinus1Compare = useMemo(
    () => [
      {
        label: 'Encaissements',
        current: metrics.collected,
        prev: Math.round(metrics.collected * 0.88),
      },
      {
        label: 'Charges & salaires',
        current: metrics.payrollSum + metrics.expensesSum,
        prev: Math.round((metrics.payrollSum + metrics.expensesSum) * 0.94),
      },
      {
        label: 'Impayés ouverts',
        current: metrics.overdue,
        prev: Math.round(metrics.overdue * 1.15),
      },
    ],
    [metrics]
  );

  return (
    <ModuleGate moduleKey="exports" allowedRoles={['director', 'accountant']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Rapports analytiques & financiers
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Comparaison N / N-1, cash-flow indicatif et
              synthèse multi-sites (Données démo)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const label = `Vue ${siteFilter === 'all' ? 'Tous sites' : siteFilter} · ${periodFilter}`;
                setSavedViews((prev) =>
                  prev.includes(label) ? prev : [...prev, label]
                );
                toast.success(`Rapport sauvegardé en démo : ${label}`);
              }}
              className="gap-1.5"
            >
              <BookmarkPlus className="size-4" />
              Sauvegarder vue
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                downloadSafeCsv(
                  `rapport-direction-${activeCenter.id}.csv`,
                  ['Indicateur', 'Valeur', 'Période', 'Site'],
                  [
                    ['Encaissements actifs', formatMAD(metrics.collected), periodFilter, siteFilter],
                    ['Impayés ouverts', formatMAD(metrics.overdue), periodFilter, siteFilter],
                    ['Paie indicative', formatMAD(metrics.payrollSum), periodFilter, siteFilter],
                    ['Charges actives', formatMAD(metrics.expensesSum), periodFilter, siteFilter],
                    ['Cash-flow indicatif', formatMAD(metrics.cashFlowIndicative), periodFilter, siteFilter],
                    ['Taux présence', `${metrics.attendanceRate} %`, periodFilter, siteFilter],
                  ]
                );
                toast.success('Synthèse CSV exportée.');
              }}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Exporter synthèse
            </Button>
          </div>
        </div>

        <GlobalBanner
          tone="info"
          title="Données démo — Indicateurs de gestion non audités"
          description="Les chiffres et comparaisons N / N-1 sont calculés dynamiquement depuis les données fictives du centre actif."
        />

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={periodFilter}
            onValueChange={(v) => setPeriodFilter(v ?? 'Novembre 2026')}
          >
            <SelectTrigger className="h-9 w-[200px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Novembre 2026">Novembre 2026</SelectItem>
              <SelectItem value="Trimestre 1 (2026)">
                Trimestre 1 (2026)
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={siteFilter}
            onValueChange={(v) => setSiteFilter(v ?? 'all')}
          >
            <SelectTrigger className="h-9 w-[220px] text-xs">
              <SelectValue />
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

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Vues mémorisées :</span>
            {savedViews.map((v) => (
              <span
                key={v}
                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* KPI Cash-flow & activité */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Encaissements (Données démo)
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {formatMAD(metrics.collected)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Charges + paie indicative
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {formatMAD(metrics.payrollSum + metrics.expensesSum)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Cash-flow indicatif
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {formatMAD(metrics.cashFlowIndicative)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Fréquentation · Inscriptions
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {metrics.attendanceRate} % · {metrics.activeEnrollments}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Répartition par mode de paiement */}
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4 text-primary" />
                Encaissements par mode de règlement (Données démo)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.methodBreakdown.map((item) => {
                const pct =
                  metrics.collected > 0
                    ? Math.round((item.amount / metrics.collected) * 100)
                    : 0;
                return (
                  <div key={item.method} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.method}</span>
                      <span className="font-mono tabular-nums">
                        {formatMAD(item.amount)} ({pct} %)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Comparaison N / N-1 */}
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Comparaison période N / N-1 (Données démo)
              </CardTitle>
              <CardDescription className="text-xs">
                Base comparative simulée pour lecture de tendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {nMinus1Compare.map((row) => {
                const max = Math.max(row.current, row.prev, 1);
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span>{row.label}</span>
                      <span className="font-mono tabular-nums">
                        N : {formatMAD(row.current)} · N-1 : {formatMAD(row.prev)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.round((row.current / max) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-muted-foreground/45"
                          style={{
                            width: `${Math.round((row.prev / max) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleGate>
  );
}
