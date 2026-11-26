'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  Copy,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
import { FormFieldWrapper, PhoneInputMA } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { GuardianRecord } from '@/types/profiles';

function cleanPhoneForWa(phone: string) {
  return phone.replace(/[^0-9]/g, '');
}

export default function AdminGuardiansPage() {
  const { activeCenter, hasModule } = useDemoSession();
  const { guardians, students, addGuardian, mergeGuardians } =
    useProfilesStore();

  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [mergePair, setMergePair] = useState<{
    keep: GuardianRecord;
    remove: GuardianRecord;
  } | null>(null);
  const [composeTarget, setComposeTarget] = useState<GuardianRecord | null>(
    null
  );
  const [composeChannel, setComposeChannel] = useState<'inapp' | 'email' | 'whatsapp'>('inapp');
  const [composeBody, setComposeBody] = useState(
    'Bonjour, voici une communication d’information de votre centre (aperçu Mode Démo).'
  );
  const [newOpen, setNewOpen] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newRelation, setNewRelation] = useState<'Mère' | 'Père' | 'Tuteur légal'>('Mère');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const studentMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of students) m.set(s.id, `${s.firstName} ${s.lastName}`);
    return m;
  }, [students]);

  const duplicateGroups = useMemo(() => {
    const byPhone = new Map<string, GuardianRecord[]>();
    for (const g of guardians) {
      const key = cleanPhoneForWa(g.phone);
      if (!key) continue;
      const arr = byPhone.get(key) ?? [];
      arr.push(g);
      byPhone.set(key, arr);
    }
    return Array.from(byPhone.values()).filter((arr) => arr.length > 1);
  }, [guardians]);

  const columns = useMemo<ColumnDef<GuardianRecord>[]>(
    () => [
      {
        id: 'guardian',
        header: 'Responsable',
        accessorFn: (g) => `${g.firstName} ${g.lastName} ${g.phone} ${g.email}`,
        cell: ({ row }) => {
          const g = row.original;
          return (
            <div>
              <Link
                href={`/admin/guardians/${g.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {g.firstName} {g.lastName}
              </Link>
              <p className="text-[11px] text-muted-foreground">
                {g.relation} · Langue {g.preferredLang.toUpperCase()}
                {g.isPrimary ? ' · Prioritaire' : ''}
                {g.isFinancialResponsible ? ' · Financier' : ''}
                {g.isRestricted ? ' · Contact restreint' : ''}
              </p>
            </div>
          );
        },
      },
      {
        id: 'children',
        header: 'Élèves liés',
        cell: ({ row }) => {
          const names = row.original.studentIds
            .map((id) => studentMap.get(id))
            .filter(Boolean);
          return (
            <span className="text-xs text-muted-foreground">
              {names.length > 0 ? names.join(', ') : 'Aucun élève'}
            </span>
          );
        },
      },
      {
        id: 'contacts',
        header: 'Coordonnées & liens directs',
        cell: ({ row }) => {
          const g = row.original;
          const waNum = cleanPhoneForWa(g.whatsappPhone || g.phone);
          return (
            <div className="space-y-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${g.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1 font-mono text-foreground hover:text-primary"
                >
                  <Phone className="size-3" />
                  {g.phone}
                </a>
                <button
                  type="button"
                  aria-label="Copier le numéro"
                  onClick={() => {
                    navigator.clipboard?.writeText(g.phone);
                    toast.info('Numéro copié');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="size-3" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <a
                  href={`mailto:${g.email}`}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Mail className="size-3" />
                  {g.email}
                </a>
                {hasModule('messaging.whatsapp') && g.consents.whatsapp && (
                  <a
                    href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Bonjour ${g.firstName}, message depuis ${activeCenter.name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-success hover:underline"
                  >
                    <MessageSquare className="size-3" />
                    Composer WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'consents',
        header: 'Consentements',
        cell: ({ row }) => {
          const c = row.original.consents;
          const activeChannels = [
            c.whatsapp ? 'WhatsApp' : null,
            c.email ? 'Email' : null,
            c.sms ? 'SMS' : null,
          ].filter(Boolean);
          return (
            <div className="text-xs">
              <p className="font-medium">
                {activeChannels.length > 0
                  ? activeChannels.join(' · ')
                  : 'Appels manuels uniquement'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Calme : {row.original.quietHours}
              </p>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/guardians/${row.original.id}`}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              Fiche
            </Link>
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={row.original.isRestricted}
              onClick={() => setComposeTarget(row.original)}
            >
              Préparer msg
            </Button>
          </div>
        ),
      },
    ],
    [studentMap, hasModule, activeCenter.name]
  );

  const handleCreateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFirst.trim().length < 2 || newPhone.trim().length < 8) {
      toast.error('Prénom et téléphone valides requis');
      return;
    }
    const created: GuardianRecord = {
      id: `gua-${Date.now()}`,
      centerId: activeCenter.id,
      firstName: newFirst.trim(),
      lastName: newLast.trim() || 'Famille',
      relation: newRelation,
      studentIds: [],
      phone: `+212 ${newPhone.trim()}`,
      whatsappPhone: `+212 ${newPhone.trim()}`,
      email: newEmail.trim() || 'contact@famille.demo',
      preferredLang: 'fr',
      isPrimary: true,
      isFinancialResponsible: false,
      isEmergencyContact: true,
      isRestricted: false,
      quietHours: '21:00–08:00',
      consents: {
        whatsapp: true,
        email: true,
        sms: false,
        absence: true,
        late: true,
        payment: false,
        documents: true,
        announcements: false,
      },
      internalNotes: '',
      consentHistory: [
        {
          id: `ch-${Date.now()}`,
          dateLabel: "Aujourd'hui",
          actor: 'Accueil (démo)',
          detail: 'Fiche responsable créée en Mode Démo',
        },
      ],
    };
    addGuardian(created);
    setNewOpen(false);
    setNewFirst('');
    setNewLast('');
    setNewPhone('');
    setNewEmail('');
    toast.success('Responsable ajouté en Mode Démo');
  };

  return (
    <ModuleGate
      moduleKey="guardians"
      allowedRoles={['director', 'secretary']}
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Parents &amp; Responsables — {activeCenter.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Contacts multiples par élève, préférences de langue FR/AR et
              suivi des consentements (actions externes simulées).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuplicatesOpen(true)}
              className="gap-1.5"
            >
              <AlertTriangle className="size-3.5 text-warning" />
              Doublons ({duplicateGroups.length})
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setNewOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Nouveau responsable
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={guardians}
          searchPlaceholder="Rechercher nom, téléphone, email..."
          renderMobileCard={(g) => (
            <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/guardians/${g.id}`}
                  className="font-semibold hover:text-primary"
                >
                  {g.firstName} {g.lastName}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {g.relation}
                </span>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                {g.phone}
              </p>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span>
                  {g.isFinancialResponsible ? 'Financier' : 'Contact suivi'}
                </span>
                <Link
                  href={`/admin/guardians/${g.id}`}
                  className="font-medium text-primary"
                >
                  Consentements →
                </Link>
              </div>
            </div>
          )}
          emptyTitle="Aucun responsable enregistré"
          emptyDescription="Ajoutez un parent ou tuteur légal pour ce centre."
        />
      </div>

      {/* Duplicate Detection Dialog */}
      <Dialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Détection de doublons de contact
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fiches partageant exactement le même numéro de téléphone principal.
            </DialogDescription>
          </DialogHeader>
          {duplicateGroups.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Aucun doublon détecté sur ce centre.
            </p>
          ) : (
            <div className="space-y-3">
              {duplicateGroups.map((group, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-xl border border-border p-3 text-xs"
                >
                  <p className="font-mono font-medium">
                    Numéro partagé : {group[0].phone}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {group.map((g) => `${g.firstName} ${g.lastName}`).join(' vs ')}
                    </span>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setMergePair({ keep: group[0], remove: group[1] });
                        setDuplicatesOpen(false);
                      }}
                    >
                      Fusionner vers {group[0].firstName}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Merge Confirmation */}
      <ConfirmDialog
        open={Boolean(mergePair)}
        onOpenChange={(o) => {
          if (!o) setMergePair(null);
        }}
        variant="destructive"
        title="Fusionner ces deux fiches responsables ?"
        description={
          mergePair
            ? `Les élèves rattachés à ${mergePair.remove.firstName} ${mergePair.remove.lastName} seront transférés vers ${mergePair.keep.firstName} ${mergePair.keep.lastName}.`
            : ''
        }
        confirmLabel="Fusionner (démo)"
        onConfirm={() => {
          if (!mergePair) return;
          mergeGuardians(mergePair.keep.id, mergePair.remove.id);
          toast.success('Fiches fusionnées dans le prototype');
          setMergePair(null);
        }}
      />

      {/* Simulated Message Composer Sheet */}
      <Sheet
        open={Boolean(composeTarget)}
        onOpenChange={(o) => {
          if (!o) setComposeTarget(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {composeTarget && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle>
                  Préparer un message — {composeTarget.firstName}{' '}
                  {composeTarget.lastName}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Prévisualisé (démo) uniquement : aucun message réel n&apos;est
                  expédié par serveur.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 text-sm">
                <Select
                  value={composeChannel}
                  onValueChange={(v) =>
                    setComposeChannel(
                      (v as 'inapp' | 'email' | 'whatsapp') ?? 'inapp'
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inapp">
                      Annonce interne (In-App)
                    </SelectItem>
                    {hasModule('messaging.email') && (
                      <SelectItem value="email">Email (simulé)</SelectItem>
                    )}
                    {hasModule('messaging.whatsapp') && (
                      <SelectItem value="whatsapp">
                        WhatsApp (prévisualisation)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Textarea
                  rows={4}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                />

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    toast.info('Prévisualisé (démo) — aucun envoi réel', {
                      description: `Message ${composeChannel} préparé pour ${composeTarget.firstName} ${composeTarget.lastName}.`,
                    });
                    setComposeTarget(null);
                  }}
                >
                  Enregistrer en « Envoi simulé »
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Guardian Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau responsable familial</DialogTitle>
            <DialogDescription className="text-xs">
              Ajoutez un parent ou tuteur fictif pour {activeCenter.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGuardian} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormFieldWrapper id="ng-first" label="Prénom" required>
                <Input
                  id="ng-first"
                  value={newFirst}
                  onChange={(e) => setNewFirst(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="ng-last" label="Nom" required>
                <Input
                  id="ng-last"
                  value={newLast}
                  onChange={(e) => setNewLast(e.target.value)}
                />
              </FormFieldWrapper>
            </div>
            <FormFieldWrapper id="ng-rel" label="Lien familial">
              <Select
                value={newRelation}
                onValueChange={(v) =>
                  setNewRelation(
                    (v as 'Mère' | 'Père' | 'Tuteur légal') ?? 'Mère'
                  )
                }
              >
                <SelectTrigger id="ng-rel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mère">Mère</SelectItem>
                  <SelectItem value="Père">Père</SelectItem>
                  <SelectItem value="Tuteur légal">Tuteur légal</SelectItem>
                </SelectContent>
              </Select>
            </FormFieldWrapper>
            <FormFieldWrapper id="ng-phone" label="Téléphone" required>
              <PhoneInputMA
                id="ng-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </FormFieldWrapper>
            <FormFieldWrapper id="ng-email" label="Email">
              <Input
                id="ng-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleGate>
  );
}
