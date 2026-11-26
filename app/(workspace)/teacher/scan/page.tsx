'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  QrCode,
  ShieldAlert,
  Volume2,
  VolumeX,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ModuleGate } from '@/components/feedback/module-gate';
import { EmptyState, GlobalBanner } from '@/components/feedback/states';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAttendanceStore } from '@/stores/attendance-context';
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import type {
  AttendanceRecord,
  AttendanceStatus,
  QrScanSimulationResult,
  QrValidationOutcome,
} from '@/types/attendance';

const LazyQrCameraScanner = dynamic(
  () =>
    import('@/components/attendance/qr-camera-scanner').then(
      (mod) => mod.QrCameraScanner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 animate-pulse rounded-xl border border-border bg-muted/40" />
    ),
  }
);

function playSoftFeedbackTone(success: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = success ? 740 : 320;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio context blocks
  }
}

const OUTCOME_STYLE: Record<
  QrValidationOutcome,
  { border: string; bg: string; text: string; icon: 'ok' | 'warn' | 'err' }
> = {
  present: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-900 dark:text-emerald-100',
    icon: 'ok',
  },
  deja_enregistre: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/12',
    text: 'text-amber-950 dark:text-amber-100',
    icon: 'warn',
  },
  mauvaise_seance: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    text: 'text-rose-950 dark:text-rose-100',
    icon: 'err',
  },
  eleve_non_inscrit: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    text: 'text-rose-950 dark:text-rose-100',
    icon: 'err',
  },
  qr_expire: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/12',
    text: 'text-amber-950 dark:text-amber-100',
    icon: 'warn',
  },
  hors_creneau: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/12',
    text: 'text-amber-950 dark:text-amber-100',
    icon: 'warn',
  },
  erreur_reseau: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    text: 'text-rose-950 dark:text-rose-100',
    icon: 'err',
  },
};

export default function TeacherScanPage() {
  const { activeCenter, activeUser, hasModule } = useDemoSession();
  const { sessions } = usePedagogyStore();
  const {
    records,
    updateAttendanceStatus,
    simulateQrScan,
    closeSessionRollCall,
  } = useAttendanceStore();

  const qrEnabled = hasModule('attendance.qr');

  const todaySessions = useMemo(() => {
    const today = sessions.filter((s) => s.dateISO === '2026-11-26');
    return today.length > 0 ? today : sessions;
  }, [sessions]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    todaySessions[0]?.id ?? ''
  );

  const effectiveSessionId = useMemo(() => {
    if (todaySessions.some((s) => s.id === selectedSessionId)) {
      return selectedSessionId;
    }
    return todaySessions[0]?.id ?? '';
  }, [todaySessions, selectedSessionId]);

  const currentSession = useMemo(
    () => todaySessions.find((s) => s.id === effectiveSessionId),
    [todaySessions, effectiveSessionId]
  );

  const sessionRoster = useMemo(
    () => records.filter((r) => r.sessionId === effectiveSessionId),
    [records, effectiveSessionId]
  );

  const counters = useMemo(() => {
    const expected = sessionRoster.length;
    const present = sessionRoster.filter((r) => r.status === 'present').length;
    const late = sessionRoster.filter((r) => r.status === 'retard').length;
    const absent = sessionRoster.filter(
      (r) => r.status === 'absent' || r.status === 'excuse'
    ).length;
    const pending = sessionRoster.filter(
      (r) => r.status === 'non_pointe'
    ).length;
    return { expected, present, late, absent, pending };
  }, [sessionRoster]);

  const [manualInput, setManualInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastResult, setLastResult] = useState<QrScanSimulationResult | null>(
    null
  );
  const [closeSummaryOpen, setCloseSummaryOpen] = useState(false);

  const [correctionTarget, setCorrectionTarget] = useState<{
    record: AttendanceRecord;
    nextStatus: AttendanceStatus;
  } | null>(null);

  const runQrSimulation = (
    input: string,
    forceScenario?: QrValidationOutcome
  ) => {
    if (!effectiveSessionId) {
      toast.error('Sélectionnez une séance avant de scanner.');
      return;
    }

    const res = simulateQrScan({
      sessionId: effectiveSessionId,
      scannedInput: input,
      forceScenario,
      actor: activeUser.fullName,
      deviceLabel: 'Interface Scan Professeur (Mode Démo)',
    });

    setLastResult(res);

    if (soundEnabled) {
      playSoftFeedbackTone(res.outcome === 'present');
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(res.outcome === 'present' ? 60 : [50, 40, 50]);
    }

    if (res.outcome === 'present') {
      toast.success(`${res.studentName} pointé(e) présent(e) (démo)`);
    } else if (res.outcome === 'deja_enregistre') {
      toast.warning(`${res.studentName} déjà pointé(e) — aucun double compte`);
    } else {
      toast.error(res.title);
    }
  };

  const handleManualStatusClick = (
    rec: AttendanceRecord,
    nextStatus: AttendanceStatus
  ) => {
    if (rec.status !== 'non_pointe' && rec.status !== nextStatus) {
      setCorrectionTarget({ record: rec, nextStatus });
      return;
    }
    updateAttendanceStatus(rec.id, {
      status: nextStatus,
      source: 'appel_manuel',
      actor: activeUser.fullName,
      note: 'Appel manuel professeur.',
    });
    toast.success(`${rec.studentName} marqué(e) ${nextStatus}`);
  };

  return (
    <ModuleGate moduleKey="attendance.manual" allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {qrEnabled ? 'Présences & Scanner QR' : 'Appel manuel de séance'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · {activeUser.fullName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {qrEnabled && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                {soundEnabled ? (
                  <Volume2 className="size-3.5 text-primary" />
                ) : (
                  <VolumeX className="size-3.5" />
                )}
                <span>Bip sonore</span>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </label>
            )}
            <Button
              type="button"
              onClick={() => setCloseSummaryOpen(true)}
              disabled={!effectiveSessionId}
              className="gap-1.5"
            >
              <ClipboardCheck className="size-4" />
              Clôturer l&apos;appel
            </Button>
          </div>
        </div>

        {/* Sélecteur de séance + compteurs */}
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col gap-4 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 lg:min-w-[340px]">
              <Label className="text-xs font-medium">Séance en cours</Label>
              <Select
                value={effectiveSessionId}
                onValueChange={(v) => setSelectedSessionId(v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une séance" />
                </SelectTrigger>
                <SelectContent>
                  {todaySessions.map((ses) => (
                    <SelectItem key={ses.id} value={ses.id}>
                      {ses.dateLabel} · {ses.startTime}–{ses.endTime} —{' '}
                      {ses.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentSession && (
                <p className="text-xs text-muted-foreground">
                  {currentSession.title} · {currentSession.roomName} (
                  {currentSession.siteName})
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Attendus</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {counters.expected}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-emerald-500/10 px-3 py-2">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Présents
                </p>
                <p className="font-mono text-lg font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                  {counters.present}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-amber-500/10 px-3 py-2">
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  En retard
                </p>
                <p className="font-mono text-lg font-semibold text-amber-700 tabular-nums dark:text-amber-300">
                  {counters.late}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-rose-500/10 px-3 py-2">
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Absents / attente
                </p>
                <p className="font-mono text-lg font-semibold text-rose-700 tabular-nums dark:text-rose-300">
                  {counters.absent + counters.pending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone Scanner QR (si module attendance.qr activé) */}
        {qrEnabled ? (
          <div className="space-y-4">
            <GlobalBanner
              tone="warning"
              title="Mode Démo : vérifications anti-fraude non actives côté serveur"
              description="Les vérifications anti-fraude et la persistance nécessitent le serveur. Un simple QR statique ne protège pas contre la copie ou le partage entre élèves."
            />

            <div className="grid gap-4 lg:grid-cols-12">
              <Card className="border-border shadow-none lg:col-span-7">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <QrCode className="size-4 text-primary" />
                    Lecteur caméra & saisie de secours
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Optimisé pour prise en main mobile ou saisie directe du code
                    ELV
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LazyQrCameraScanner
                    onSimulatedDetect={(code) => runQrSimulation(code)}
                  />

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!manualInput.trim()) return;
                      runQrSimulation(manualInput);
                      setManualInput('');
                    }}
                    className="flex flex-col gap-2 sm:flex-row"
                  >
                    <Input
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Saisir code élève ou jeton QR (ex: ELV-2026-001)"
                      className="font-mono text-xs"
                    />
                    <Button type="submit" variant="secondary">
                      Valider code
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border shadow-none lg:col-span-5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Simulateur de scénarios QR & résultat
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Testez les 7 états de validation en un clic
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => runQrSimulation('ELV-2026-001', 'present')}
                      className="justify-start text-xs"
                    >
                      Présent valide
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runQrSimulation('ELV-2026-003', 'deja_enregistre')
                      }
                      className="justify-start text-xs"
                    >
                      QR déjà scanné
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runQrSimulation('ELV-2026-004', 'mauvaise_seance')
                      }
                      className="justify-start text-xs"
                    >
                      Mauvaise séance
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runQrSimulation('ELV-9999-000', 'eleve_non_inscrit')
                      }
                      className="justify-start text-xs"
                    >
                      Élève non inscrit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runQrSimulation('EXPIRED-QR', 'qr_expire')
                      }
                      className="justify-start text-xs"
                    >
                      QR expiré
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runQrSimulation('OUT-SLOT', 'hors_creneau')
                      }
                      className="justify-start text-xs"
                    >
                      Scan hors créneau
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runQrSimulation('NET-ERR', 'erreur_reseau')
                      }
                      className="col-span-2 justify-start gap-1.5 text-xs"
                    >
                      <WifiOff className="size-3.5" />
                      Simuler erreur réseau (fallback appel manuel)
                    </Button>
                  </div>

                  {lastResult ? (
                    <div
                      className={cn(
                        'rounded-xl border p-3.5 text-xs',
                        OUTCOME_STYLE[lastResult.outcome].border,
                        OUTCOME_STYLE[lastResult.outcome].bg,
                        OUTCOME_STYLE[lastResult.outcome].text
                      )}
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex items-start gap-2.5">
                        {OUTCOME_STYLE[lastResult.outcome].icon === 'ok' ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                        ) : OUTCOME_STYLE[lastResult.outcome].icon === 'warn' ? (
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        ) : (
                          <XCircle className="mt-0.5 size-4 shrink-0" />
                        )}
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {lastResult.title}
                          </p>
                          <p className="font-mono text-[11px]">
                            {lastResult.studentName} · {lastResult.studentCode}
                          </p>
                          <p>{lastResult.message}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      En attente d&apos;un scan QR ou d&apos;une simulation.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <GlobalBanner
            tone="info"
            title="Scanner QR non activé sur cette instance"
            description="Ce centre fonctionne en mode appel manuel uniquement (attendance.qr désactivé). Pointez vos élèves directement dans la liste ci-dessous."
          />
        )}

        {/* Liste d'appel manuel tactile */}
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Feuille d&apos;appel manuelle de la séance
            </CardTitle>
            <CardDescription className="text-xs">
              Pointage direct en 1 tap · Motif obligatoire en cas de
              modification d&apos;un élève déjà pointé
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionRoster.length === 0 ? (
              <EmptyState
                icon={<Clock className="size-5" />}
                title="Aucun élève rattaché à cette séance démo"
                description="Sélectionnez une autre séance en cours dans le menu ci-dessus."
              />
            ) : (
              <div className="divide-y divide-border">
                {sessionRoster.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {rec.studentInitials}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{rec.studentName}</p>
                        <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                          {rec.studentCode} ·{' '}
                          {rec.checkInTime === '—'
                            ? 'Non pointé'
                            : `Pointé à ${rec.checkInTime}`}
                          {rec.source === 'qr_simule' ? ' (QR simulé)' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center">
                      {(
                        [
                          { id: 'present', label: 'Présent' },
                          { id: 'retard', label: 'Retard' },
                          { id: 'absent', label: 'Absent' },
                          { id: 'excuse', label: 'Excusé' },
                        ] as { id: AttendanceStatus; label: string }[]
                      ).map((btn) => {
                        const active = rec.status === btn.id;
                        return (
                          <Button
                            key={btn.id}
                            type="button"
                            size="sm"
                            variant={active ? 'default' : 'outline'}
                            onClick={() =>
                              handleManualStatusClick(rec, btn.id)
                            }
                            className="h-8 px-2.5 text-xs"
                          >
                            {btn.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motif obligatoire si correction d'un pointage existant */}
        <ConfirmDialog
          open={Boolean(correctionTarget)}
          onOpenChange={(open) => !open && setCorrectionTarget(null)}
          title={
            correctionTarget
              ? `Modifier le pointage de ${correctionTarget.record.studentName}`
              : ''
          }
          description="Cet élève possède déjà un statut enregistré. Précisez le motif de correction."
          requireReason
          reasonLabel="Motif de correction"
          reasonPlaceholder="Ex: Erreur de saisie, arrivée tardive confirmée..."
          confirmLabel="Confirmer la correction"
          onConfirm={(reason) => {
            if (!correctionTarget) return;
            updateAttendanceStatus(correctionTarget.record.id, {
              status: correctionTarget.nextStatus,
              source: 'appel_manuel',
              justificationReason: reason,
              actor: activeUser.fullName,
            });
            toast.success(
              `Pointage corrigé pour ${correctionTarget.record.studentName}`
            );
            setCorrectionTarget(null);
          }}
        />

        {/* Modal de clôture d'appel */}
        <Dialog open={closeSummaryOpen} onOpenChange={setCloseSummaryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Clôturer l&apos;appel de la séance</DialogTitle>
              <DialogDescription>
                {currentSession?.title} ({currentSession?.startTime}–
                {currentSession?.endTime})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <span className="text-muted-foreground">Présents :</span>{' '}
                  <strong className="font-mono tabular-nums">
                    {counters.present}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Retards :</span>{' '}
                  <strong className="font-mono tabular-nums">
                    {counters.late}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Absents / Excusés :
                  </span>{' '}
                  <strong className="font-mono tabular-nums">
                    {counters.absent}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Non pointés :</span>{' '}
                  <strong className="font-mono tabular-nums">
                    {counters.pending}
                  </strong>
                </div>
              </div>
              {counters.pending > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-950 dark:text-amber-100">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p>
                    {counters.pending} élève(s) encore « Non pointé » seront
                    automatiquement marqués « Absent » lors de la clôture.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCloseSummaryOpen(false)}
              >
                Revenir à l&apos;appel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const markedAbsent = closeSessionRollCall(
                    effectiveSessionId,
                    activeUser.fullName
                  );
                  toast.success(
                    markedAbsent > 0
                      ? `Appel clôturé (${markedAbsent} élève(s) non pointé(s) passés absent).`
                      : 'Appel clôturé avec succès (Mode Démo).'
                  );
                  setCloseSummaryOpen(false);
                }}
              >
                Confirmer la clôture
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleGate>
  );
}
