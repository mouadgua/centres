'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Phone,
  ShieldCheck,
  Unlink,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ErrorState } from '@/components/feedback/states';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { GuardianRecord } from '@/types/profiles';

function createConsentHistoryEntry(
  key: keyof GuardianRecord['consents'],
  value: boolean
) {
  return {
    id: `ch-${Date.now()}`,
    dateLabel: "Aujourd'hui",
    actor: 'Administration (démo)',
    detail: `Consentement « ${key} » basculé sur ${value ? 'Autorisé' : 'Refusé'}`,
  };
}

export default function AdminGuardianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { hasModule } = useDemoSession();
  const {
    guardians,
    students,
    updateGuardian,
    linkStudentToGuardian,
    unlinkStudentFromGuardian,
  } = useProfilesStore();

  const guardian = guardians.find((g) => g.id === id);
  const [unlinkStudentId, setUnlinkStudentId] = useState<string | null>(null);
  const [restrictConfirmOpen, setRestrictConfirmOpen] = useState(false);
  const [studentToAdd, setStudentToAdd] = useState<string>('');
  const [notesDraft, setNotesDraft] = useState(guardian?.internalNotes ?? '');

  if (!guardian) {
    return (
      <ModuleGate
        moduleKey="guardians"
        allowedRoles={['director', 'secretary']}
      >
        <ErrorState
          code="404"
          title="Fiche responsable introuvable"
          description="Ce responsable n'existe pas dans le centre sélectionné."
        />
      </ModuleGate>
    );
  }

  const linkedStudents = students.filter((s) =>
    guardian.studentIds.includes(s.id)
  );
  const availableToLink = students.filter(
    (s) => !guardian.studentIds.includes(s.id)
  );

  const toggleConsent = (
    key: keyof typeof guardian.consents,
    value: boolean
  ) => {
    updateGuardian(guardian.id, {
      consents: { ...guardian.consents, [key]: value },
      consentHistory: [
        createConsentHistoryEntry(key, value),
        ...guardian.consentHistory,
      ],
    });
    toast.success('Préférence de consentement mise à jour (Mode Démo)');
  };

  return (
    <ModuleGate
      moduleKey="guardians"
      allowedRoles={['director', 'secretary']}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/guardians"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux responsables
          </Link>

          <Button
            type="button"
            size="sm"
            variant={guardian.isRestricted ? 'outline' : 'destructive'}
            onClick={() => setRestrictConfirmOpen(true)}
          >
            {guardian.isRestricted
              ? 'Lever la restriction contact'
              : 'Marquer contact interdit / retiré'}
          </Button>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {guardian.firstName} {guardian.lastName}
            </CardTitle>
            <CardDescription>
              {guardian.relation} ·{' '}
              <a
                href={`tel:${guardian.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1 font-mono text-foreground hover:underline"
              >
                <Phone className="size-3" />
                {guardian.phone}
              </a>{' '}
              · {guardian.email} · Langue :{' '}
              <strong>{guardian.preferredLang.toUpperCase()}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2">
              <Switch
                checked={guardian.isPrimary}
                onCheckedChange={(v) =>
                  updateGuardian(guardian.id, { isPrimary: v })
                }
              />
              Contact prioritaire
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={guardian.isFinancialResponsible}
                onCheckedChange={(v) =>
                  updateGuardian(guardian.id, { isFinancialResponsible: v })
                }
              />
              Responsable financier
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={guardian.isEmergencyContact}
                onCheckedChange={(v) =>
                  updateGuardian(guardian.id, { isEmergencyContact: v })
                }
              />
              Contact d&apos;urgence
            </label>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Linked Children */}
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" />
                Enfants rattachés ({linkedStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {linkedStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div>
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {s.firstName} {s.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {s.level} · {s.groupNames.join(', ')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => setUnlinkStudentId(s.id)}
                    className="gap-1 text-destructive"
                  >
                    <Unlink className="size-3.5" />
                    Dissocier
                  </Button>
                </div>
              ))}

              {availableToLink.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Select
                    value={studentToAdd}
                    onValueChange={(v) => setStudentToAdd(v ?? '')}
                  >
                    <SelectTrigger className="flex-1 text-xs">
                      <SelectValue placeholder="Associer un élève existant..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToLink.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!studentToAdd}
                    onClick={() => {
                      if (!studentToAdd) return;
                      linkStudentToGuardian(guardian.id, studentToAdd);
                      setStudentToAdd('');
                      toast.success('Élève rattaché au responsable');
                    }}
                  >
                    Associer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consents & Quiet Hours */}
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-primary" />
                Canaux &amp; consentements par catégorie
              </CardTitle>
              <CardDescription className="text-xs">
                Heures calmes : {guardian.quietHours} · Envois externes simulés
                uniquement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
                  <span>WhatsApp</span>
                  <Switch
                    disabled={!hasModule('messaging.whatsapp')}
                    checked={
                      hasModule('messaging.whatsapp') &&
                      guardian.consents.whatsapp
                    }
                    onCheckedChange={(v) => toggleConsent('whatsapp', v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
                  <span>Email</span>
                  <Switch
                    disabled={!hasModule('messaging.email')}
                    checked={
                      hasModule('messaging.email') && guardian.consents.email
                    }
                    onCheckedChange={(v) => toggleConsent('email', v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
                  <span>SMS</span>
                  <Switch
                    disabled={!hasModule('messaging.sms')}
                    checked={
                      hasModule('messaging.sms') && guardian.consents.sms
                    }
                    onCheckedChange={(v) => toggleConsent('sms', v)}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { key: 'absence', label: 'Alertes absences' },
                    { key: 'late', label: 'Retards' },
                    { key: 'payment', label: 'Paiements & reçus' },
                    { key: 'documents', label: 'Demandes de pièces' },
                    { key: 'announcements', label: 'Annonces générales' },
                  ] as const
                ).map((cat) => (
                  <div
                    key={cat.key}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span>{cat.label}</span>
                    <Switch
                      checked={guardian.consents[cat.key]}
                      onCheckedChange={(v) => toggleConsent(cat.key, v)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Restricted internal notes */}
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4 text-muted-foreground" />
                Notes internes (accès administration uniquement)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Notes confidentielles de suivi familial..."
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  updateGuardian(guardian.id, { internalNotes: notesDraft });
                  toast.success('Note interne mise à jour (Mode Démo)');
                }}
              >
                Enregistrer la note
              </Button>
            </CardContent>
          </Card>

          {/* Consent History */}
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Journal des consentements (fictif)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {guardian.consentHistory.length === 0 ? (
                <p>Aucun événement enregistré récemment.</p>
              ) : (
                guardian.consentHistory.map((h) => (
                  <div key={h.id} className="border-b border-border pb-2 last:border-0">
                    <p className="font-medium text-foreground">{h.detail}</p>
                    <p>
                      {h.dateLabel} · {h.actor}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(unlinkStudentId)}
        onOpenChange={(o) => {
          if (!o) setUnlinkStudentId(null);
        }}
        variant="destructive"
        title="Dissocier cet élève du responsable ?"
        description="Assurez-vous que l'élève conserve au moins un autre contact prioritaire ou d'urgence."
        confirmLabel="Dissocier"
        onConfirm={() => {
          if (!unlinkStudentId) return;
          unlinkStudentFromGuardian(guardian.id, unlinkStudentId);
          toast.success('Élève dissocié du responsable');
          setUnlinkStudentId(null);
        }}
      />

      <ConfirmDialog
        open={restrictConfirmOpen}
        onOpenChange={setRestrictConfirmOpen}
        variant={guardian.isRestricted ? 'default' : 'destructive'}
        requireReason={!guardian.isRestricted}
        reasonLabel="Motif administratif (justificatif de retrait / restriction)"
        title={
          guardian.isRestricted
            ? 'Lever la restriction de contact ?'
            : 'Interdire / retirer ce contact ?'
        }
        description="Cette règle bloque les préparations de message vers cette personne dans l'interface."
        confirmLabel="Confirmer"
        onConfirm={(reason) => {
          updateGuardian(guardian.id, {
            isRestricted: !guardian.isRestricted,
            restrictedReason: reason,
          });
          setRestrictConfirmOpen(false);
          toast.success('Statut de restriction mis à jour');
        }}
      />
    </ModuleGate>
  );
}
