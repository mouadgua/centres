'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  QrCode,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { QrCodeSvg } from '@/components/attendance/qr-code-svg';
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
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';

export default function StudentQrPage() {
  const { activeCenter, activeUser } = useDemoSession();
  const { students } = useProfilesStore();

  const [tokenVersion, setTokenVersion] = useState(1);
  const [simulateExpired, setSimulateExpired] = useState(false);

  const student = useMemo(() => {
    const matched = students.find(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase() ===
        activeUser.fullName.toLowerCase()
    );
    return matched ?? students[0];
  }, [students, activeUser.fullName]);

  const studentCode = student?.code ?? 'ELV-2026-001';
  const studentName = student
    ? `${student.firstName} ${student.lastName}`
    : activeUser.fullName;
  const studentInitials = student?.initials ?? activeUser.initials;

  const demoPayload = simulateExpired
    ? `EXPIRED-QR-${studentCode}`
    : `MARKAZFLOW-DEMO:${activeCenter.id}:${studentCode}:T${tokenVersion}`;

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(studentCode);
      toast.success(
        `Code élève ${studentCode} copié pour test dans le scanner professeur.`
      );
    } catch {
      toast.info(`Code élève : ${studentCode}`);
    }
  };

  return (
    <ModuleGate moduleKey="attendance.qr" allowedRoles={['student']}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/student"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Retour espace étudiant
            </Link>
            <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
              Mon QR étudiant (démo)
            </h1>
            <p className="text-sm text-muted-foreground">
              Carte de présence numérique pour {activeCenter.name}
            </p>
          </div>
        </div>

        <GlobalBanner
          tone="warning"
          title="QR Code statique de démonstration — non sécurisé"
          description="En production, ce QR code devra être signé cryptographiquement côté serveur, éphémère (rotation courte) et validé en temps réel contre la séance et l'inscription."
        />

        <Card className="overflow-hidden border-border shadow-none">
          <CardHeader className="border-b border-border bg-muted/25">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                  {studentInitials}
                </div>
                <div>
                  <CardTitle className="text-lg">{studentName}</CardTitle>
                  <CardDescription className="text-xs">
                    {activeCenter.name} ({activeCenter.city}) ·{' '}
                    <span className="font-mono">{studentCode}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="text-right text-xs">
                <span
                  className={
                    student?.status === 'suspendu'
                      ? 'inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300'
                      : 'inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300'
                  }
                >
                  {student?.status === 'suspendu' ? (
                    <>
                      <AlertTriangle className="size-3.5" /> Suspendu
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" /> Carte active
                    </>
                  )}
                </span>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {student?.level ?? 'Niveau démo'}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="relative">
              <QrCodeSvg
                value={demoPayload}
                size={220}
                label={`QR Code démo de ${studentName}`}
              />
              {simulateExpired && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-background/85 p-4 backdrop-blur-[2px]">
                  <ShieldAlert className="size-7 text-amber-600 dark:text-amber-400" />
                  <p className="mt-1.5 text-sm font-semibold">
                    Jeton expiré (simulation)
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Régénérez le QR pour simuler un nouveau jeton éphémère.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">
                Jeton affiché : {demoPayload}
              </p>
              <p className="text-xs text-muted-foreground">
                Groupes :{' '}
                {student?.groupNames.length
                  ? student.groupNames.join(' · ')
                  : 'Sup MPSI — Intensif'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  setSimulateExpired(false);
                  setTokenVersion((v) => v + 1);
                  toast.success('Nouveau jeton QR de démonstration généré.');
                }}
                className="gap-1.5"
              >
                <RefreshCw className="size-4" />
                Régénérer jeton démo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSimulateExpired((prev) => !prev)}
                className="gap-1.5"
              >
                <QrCode className="size-4" />
                {simulateExpired
                  ? 'Réactiver le QR'
                  : 'Simuler QR expiré'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void copyPayload()}
                className="gap-1.5"
              >
                <Copy className="size-4" />
                Copier {studentCode}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
