'use client';

import React, { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  GlobalBanner,
  TableSkeleton,
} from '@/components/feedback/states';
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from '@/components/feedback/unsaved-changes-guard';
import {
  CurrencyInput,
  FormFieldWrapper,
  PhoneInputMA,
} from '@/components/forms/form-field';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatMAD } from '@/lib/format/morocco';

interface UiKitStudentRow {
  id: string;
  code: string;
  fullName: string;
  level: string;
  groupName: string;
  monthlyFeeMad: number;
  balanceDueMad: number;
  status: 'actif' | 'en_attente' | 'impaye';
}

const INITIAL_KIT_ROWS: UiKitStudentRow[] = [
  {
    id: 'row-1',
    code: 'ELV-1042',
    fullName: 'Yassine Tazi',
    level: '2ème Bac SM',
    groupName: '2Bac SM — Groupe A',
    monthlyFeeMad: 650,
    balanceDueMad: 0,
    status: 'actif',
  },
  {
    id: 'row-2',
    code: 'ELV-1043',
    fullName: 'Salma Berrada',
    level: '1ère Bac ScEx',
    groupName: '1Bac ScEx — B',
    monthlyFeeMad: 550,
    balanceDueMad: 150,
    status: 'impaye',
  },
  {
    id: 'row-3',
    code: 'ELV-1044',
    fullName: 'Amina Bennani',
    level: 'Prépa Concours',
    groupName: 'Prépa Médecine — C1',
    monthlyFeeMad: 1200,
    balanceDueMad: 0,
    status: 'actif',
  },
  {
    id: 'row-4',
    code: 'ELV-1045',
    fullName: 'Omar Kettani',
    level: 'Tronc Commun',
    groupName: 'TC Sciences — G2',
    monthlyFeeMad: 500,
    balanceDueMad: 500,
    status: 'en_attente',
  },
  {
    id: 'row-5',
    code: 'ELV-1046',
    fullName: 'Kenza Idrissi',
    level: 'Sup MPSI',
    groupName: 'Sup MPSI — Intensif',
    monthlyFeeMad: 1500,
    balanceDueMad: 0,
    status: 'actif',
  },
];

const quickEnrollmentSchema = z.object({
  studentName: z
    .string()
    .min(3, 'Le nom complet doit contenir au moins 3 caractères.'),
  guardianPhone: z
    .string()
    .min(8, 'Saisissez un numéro marocain valide (ex. 6 12 34 56 78).'),
  level: z.string().min(1, 'Sélectionnez un niveau scolaire.'),
  monthlyFeeMad: z.coerce
    .number()
    .min(100, 'Le tarif mensuel minimum est de 100 MAD.')
    .max(10000, 'Le tarif saisi dépasse le plafond démo.'),
  notes: z.string().max(240, 'Maximum 240 caractères.').optional(),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: 'Le consentement parental de démonstration est requis.',
  }),
});

type QuickEnrollmentValues = z.infer<typeof quickEnrollmentSchema>;

export default function UiKitGalleryPage() {
  const [rows, setRows] = useState<UiKitStudentRow[]>(INITIAL_KIT_ROWS);
  const [tableStateMode, setTableStateMode] = useState<
    'populated' | 'loading' | 'empty' | 'error' | 'offline'
  >('populated');

  // ConfirmDialog states
  const [standardConfirmOpen, setStandardConfirmOpen] = useState(false);
  const [destructiveConfirmOpen, setDestructiveConfirmOpen] = useState(false);
  const [reasonConfirmOpen, setReasonConfirmOpen] = useState(false);
  const [bulkArchiveTargets, setBulkArchiveTargets] = useState<
    UiKitStudentRow[]
  >([]);
  const [bulkClearFn, setBulkClearFn] = useState<(() => void) | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [showDismissibleBanner, setShowDismissibleBanner] = useState(true);
  const [submittingForm, setSubmittingForm] = useState(false);

  const form = useForm<QuickEnrollmentValues>({
    resolver: zodResolver(quickEnrollmentSchema) as never,
    defaultValues: {
      studentName: '',
      guardianPhone: '',
      level: '2ème Bac SM',
      monthlyFeeMad: 650,
      notes: '',
      consentAccepted: false,
    },
  });

  useUnsavedChangesGuard(form.formState.isDirty);

  const columns = useMemo<ColumnDef<UiKitStudentRow>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'fullName',
        header: 'Élève',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.fullName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.level}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'groupName',
        header: 'Groupe',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.groupName}
          </span>
        ),
      },
      {
        accessorKey: 'monthlyFeeMad',
        header: 'Tarif mensuel',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium tabular-nums">
            {formatMAD(row.original.monthlyFeeMad)}
          </span>
        ),
      },
      {
        accessorKey: 'balanceDueMad',
        header: 'Solde dû',
        cell: ({ row }) => (
          <span
            className={`font-mono text-xs font-semibold tabular-nums ${
              row.original.balanceDueMad > 0
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {formatMAD(row.original.balanceDueMad)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const st = row.original.status;
          const label =
            st === 'actif'
              ? 'Actif'
              : st === 'impaye'
                ? 'Impayé'
                : 'En attente';
          const color =
            st === 'actif'
              ? 'text-success'
              : st === 'impaye'
                ? 'text-destructive'
                : 'text-warning';
          return (
            <span className={`text-xs font-medium ${color}`}>{label}</span>
          );
        },
      },
    ],
    []
  );

  const onSubmitForm = (values: QuickEnrollmentValues) => {
    setSubmittingForm(true);
    setTimeout(() => {
      const newRow: UiKitStudentRow = {
        id: `row-${Date.now()}`,
        code: `ELV-${1050 + rows.length}`,
        fullName: values.studentName,
        level: values.level,
        groupName: `${values.level} — Nouveau`,
        monthlyFeeMad: values.monthlyFeeMad,
        balanceDueMad: values.monthlyFeeMad,
        status: 'en_attente',
      };
      setRows((prev) => [newRow, ...prev]);
      setSubmittingForm(false);
      form.reset();
      toast.success(`Élève démo ajouté : ${newRow.fullName}`, {
        description: `Tarif mensuel : ${formatMAD(newRow.monthlyFeeMad)}`,
        action: {
          label: 'Annuler',
          onClick: () => {
            setRows((prev) => prev.filter((r) => r.id !== newRow.id));
            toast.info('Ajout annulé');
          },
        },
      });
    }, 350);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Galerie UI Kit & Navigation avancée (Lot 2)
        </h1>
        <p className="text-sm text-muted-foreground">
          Référentiel interne interactif des composants transversaux : DataTable
          TanStack, RHF + Zod, ConfirmDialog, bannières, états et skeletons.
        </p>
      </div>

      <Tabs defaultValue="datatable" className="space-y-5">
        <TabsList className="flex-wrap">
          <TabsTrigger value="datatable">DataTable & États</TabsTrigger>
          <TabsTrigger value="forms">Formulaires RHF + Zod</TabsTrigger>
          <TabsTrigger value="dialogs">Confirmations & Bannières</TabsTrigger>
          <TabsTrigger value="skeletons">Skeletons & Fallbacks</TabsTrigger>
        </TabsList>

        {/* Tab 1: DataTable & State Simulations */}
        <TabsContent value="datatable" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  Simulateur d&apos;états du DataTable
                </CardTitle>
                <CardDescription className="text-xs">
                  Basculez entre les états obligatoires (peuplé, chargement,
                  vide, erreur 500, hors-ligne).
                </CardDescription>
              </div>
              <div
                role="group"
                aria-label="État du tableau"
                className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/50 p-0.5"
              >
                {(
                  [
                    { id: 'populated', label: 'Peuplé' },
                    { id: 'loading', label: 'Chargement' },
                    { id: 'empty', label: 'Vide' },
                    { id: 'error', label: 'Erreur 500' },
                    { id: 'offline', label: 'Hors-ligne' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTableStateMode(mode.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                      tableStateMode === mode.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={tableStateMode === 'empty' ? [] : rows}
                isLoading={tableStateMode === 'loading'}
                error={
                  tableStateMode === 'error'
                    ? { code: '500' }
                    : tableStateMode === 'offline'
                      ? { code: 'offline' }
                      : null
                }
                onRetry={() => {
                  setTableStateMode('populated');
                  toast.success('Connexion simulée rétablie');
                }}
                searchPlaceholder="Rechercher un élève ou un groupe..."
                facetColumnId="status"
                facetOptions={[
                  { value: 'actif', label: 'Actif' },
                  { value: 'impaye', label: 'Impayé' },
                  { value: 'en_attente', label: 'En attente' },
                ]}
                enableRowSelection
                bulkActions={[
                  {
                    id: 'mark-active',
                    label: 'Marquer actif',
                    variant: 'outline',
                    onExecute: (selected, clear) => {
                      const ids = new Set(selected.map((s) => s.id));
                      setRows((prev) =>
                        prev.map((r) =>
                          ids.has(r.id) ? { ...r, status: 'actif' } : r
                        )
                      );
                      clear();
                      toast.success(
                        `${selected.length} élève(s) passé(s) en statut Actif`
                      );
                    },
                  },
                  {
                    id: 'archive',
                    label: 'Archiver (démo)',
                    variant: 'destructive',
                    onExecute: (selected, clear) => {
                      setBulkArchiveTargets(selected);
                      setBulkClearFn(() => clear);
                    },
                  },
                ]}
                emptyTitle="Aucun élève dans cette démonstration"
                emptyDescription="Réinitialisez le tableau de démonstration ou ajoutez un élève via le formulaire."
                emptyActionLabel="Restaurer les données démo"
                onEmptyAction={() => {
                  setRows(INITIAL_KIT_ROWS);
                  setTableStateMode('populated');
                }}
                renderMobileCard={(row, isSelected, toggleSelect) => (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={toggleSelect}
                        aria-label={`Sélectionner ${row.fullName}`}
                      />
                      <div>
                        <p className="text-sm font-medium">{row.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.code} · {row.groupName}
                        </p>
                        <p className="mt-1 font-mono text-xs tabular-nums">
                          {formatMAD(row.monthlyFeeMad)} / mois
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums">
                      {row.balanceDueMad > 0
                        ? `Dû : ${formatMAD(row.balanceDueMad)}`
                        : 'À jour'}
                    </span>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Forms RHF + Zod */}
        <TabsContent value="forms" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  Formulaire validé (React Hook Form + Zod)
                </CardTitle>
                <CardDescription className="text-xs">
                  Validation accessible liée aux champs, formatage MAD/téléphone
                  marocain et garde de modifications non enregistrées.
                </CardDescription>
              </div>
              {form.formState.isDirty && (
                <span className="text-xs font-medium text-warning">
                  Modifications non enregistrées
                </span>
              )}
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmitForm)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <FormFieldWrapper
                  id="studentName"
                  label="Nom complet de l'élève"
                  required
                  error={form.formState.errors.studentName?.message}
                >
                  <Input
                    id="studentName"
                    placeholder="Ex. Meriem El Idrissi"
                    aria-invalid={Boolean(form.formState.errors.studentName)}
                    {...form.register('studentName')}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="guardianPhone"
                  label="Téléphone du responsable"
                  required
                  hint="Format Maroc"
                  error={form.formState.errors.guardianPhone?.message}
                >
                  <PhoneInputMA
                    id="guardianPhone"
                    aria-invalid={Boolean(form.formState.errors.guardianPhone)}
                    {...form.register('guardianPhone')}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="level"
                  label="Niveau scolaire"
                  required
                  error={form.formState.errors.level?.message}
                >
                  <Select
                    value={form.watch('level')}
                    onValueChange={(val) =>
                      form.setValue('level', val ?? '', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="level" className="w-full">
                      <SelectValue placeholder="Choisir un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tronc Commun">Tronc Commun</SelectItem>
                      <SelectItem value="1ère Bac ScEx">1ère Bac ScEx</SelectItem>
                      <SelectItem value="2ème Bac SM">2ème Bac SM</SelectItem>
                      <SelectItem value="Prépa Concours">
                        Prépa Concours
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="monthlyFeeMad"
                  label="Mensualité convenue"
                  required
                  error={form.formState.errors.monthlyFeeMad?.message}
                >
                  <CurrencyInput
                    id="monthlyFeeMad"
                    aria-invalid={Boolean(form.formState.errors.monthlyFeeMad)}
                    {...form.register('monthlyFeeMad')}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="notes"
                  label="Notes administratives (optionnel)"
                  hint={`${form.watch('notes')?.length ?? 0}/240`}
                  error={form.formState.errors.notes?.message}
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="Précisions d'horaire ou de niveau..."
                    {...form.register('notes')}
                  />
                </FormFieldWrapper>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="consentAccepted"
                      checked={form.watch('consentAccepted')}
                      onCheckedChange={(v) =>
                        form.setValue('consentAccepted', Boolean(v), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <Label
                      htmlFor="consentAccepted"
                      className="text-xs font-normal text-muted-foreground"
                    >
                      Confirmation de démonstration : fiche fictive sans
                      données personnelles réelles.
                    </Label>
                  </div>
                  {form.formState.errors.consentAccepted && (
                    <p role="alert" className="text-xs text-destructive">
                      {form.formState.errors.consentAccepted.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (form.formState.isDirty) {
                        setUnsavedDialogOpen(true);
                      } else {
                        toast.info('Aucune modification non enregistrée');
                      }
                    }}
                  >
                    Tester la garde d&apos;abandon
                  </Button>
                  <Button type="submit" size="sm" disabled={submittingForm}>
                    {submittingForm ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    Ajouter au tableau démo
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Confirmations & Banners */}
        <TabsContent value="dialogs" className="space-y-4">
          <div className="space-y-3">
            {showDismissibleBanner && (
              <GlobalBanner
                tone="warning"
                title="Intégration Google Calendar non connectée"
                description="Bannière persistante d'exemple : la synchronisation OAuth nécessite une configuration serveur dédiée."
                actionLabel="Voir paramètres"
                onAction={() =>
                  toast.info('Redirection vers les paramètres (Lot 10)')
                }
                dismissible
                onDismiss={() => setShowDismissibleBanner(false)}
              />
            )}
            <GlobalBanner
              tone="destructive"
              title="Échéances en retard — 3 dossiers prioritaires"
              description="Exemple de bannière critique non fermable automatiquement sans action explicite."
              actionLabel="Ouvrir Impayés"
              onAction={() =>
                toast.info('Navigation vers /admin/overdue (Lot 8)')
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">
                  Confirmation standard
                </CardTitle>
                <CardDescription className="text-xs">
                  Action réversible ou validation métier simple.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setStandardConfirmOpen(true)}
                >
                  <CheckCircle2 className="size-3.5" />
                  Valider une action
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">
                  Suppression sensible
                </CardTitle>
                <CardDescription className="text-xs">
                  Affiche les conséquences et exige la saisie du mot clé.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setDestructiveConfirmOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Tester confirmation forte
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">
                  Contre-écriture financière
                </CardTitle>
                <CardDescription className="text-xs">
                  Exige un motif obligatoire avant d&apos;annuler un paiement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setReasonConfirmOpen(true)}
                >
                  <ShieldAlert className="size-3.5" />
                  Annuler un reçu (motif)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Skeletons & Fallbacks */}
        <TabsContent value="skeletons" className="space-y-6">
          <CardsSkeleton count={4} />
          <TableSkeleton rows={4} columns={5} />
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState
              title="État vide pédagogique"
              description="Explique clairement ce qui apparaîtra ici après la première création."
              actionLabel="Créer le premier élément"
              onAction={() => toast.info('CTA principal déclenché')}
            />
            <ErrorState
              code="offline"
              onRetry={() => toast.success('Nouvelle tentative simulée')}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConfirmDialog
        open={standardConfirmOpen}
        onOpenChange={setStandardConfirmOpen}
        title="Publier le planning de la semaine ?"
        description="Les séances validées seront visibles dans l'espace Professeur et l'espace Étudiant (simulation)."
        confirmLabel="Publier le planning"
        onConfirm={() => {
          setStandardConfirmOpen(false);
          toast.success('Planning publié en mode démo');
        }}
      />

      <ConfirmDialog
        open={destructiveConfirmOpen}
        onOpenChange={setDestructiveConfirmOpen}
        variant="destructive"
        title="Supprimer le groupe « 2Bac SM — Groupe A » ?"
        description="Cette action est irréversible et affecte les plannings liés."
        consequences={[
          '18 inscriptions seront détachées du groupe.',
          'Les séances futures non pointées seront annulées.',
          'L’historique financier reste conservé.',
        ]}
        requireTypedText="SUPPRIMER"
        confirmLabel="Supprimer définitivement"
        onConfirm={() => {
          setDestructiveConfirmOpen(false);
          toast.success('Suppression simulée confirmée');
        }}
      />

      <ConfirmDialog
        open={reasonConfirmOpen}
        onOpenChange={setReasonConfirmOpen}
        variant="destructive"
        title="Contrepasser le reçu REC-2026-0412 ?"
        description="Conformément aux bonnes pratiques comptables, le reçu d'origine reste tracé et une écriture d'annulation est ajoutée."
        requireReason
        reasonLabel="Motif comptable obligatoire"
        confirmLabel="Enregistrer la contre-écriture"
        onConfirm={(reason) => {
          setReasonConfirmOpen(false);
          toast.success('Contre-écriture enregistrée (démo)', {
            description: `Motif : ${reason}`,
          });
        }}
      />

      <ConfirmDialog
        open={bulkArchiveTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkArchiveTargets([]);
        }}
        variant="destructive"
        title={`Archiver ${bulkArchiveTargets.length} fiche(s) élève ?`}
        description="Les fiches sélectionnées seront retirées de la liste active de démonstration."
        consequences={bulkArchiveTargets.map(
          (r) => `${r.fullName} (${r.code})`
        )}
        requireTypedText="ARCHIVER"
        confirmLabel="Archiver la sélection"
        onConfirm={() => {
          const ids = new Set(bulkArchiveTargets.map((t) => t.id));
          setRows((prev) => prev.filter((r) => !ids.has(r.id)));
          bulkClearFn?.();
          setBulkArchiveTargets([]);
          toast.success('Sélection archivée dans la démo');
        }}
      />

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        onDiscard={() => {
          form.reset();
          setUnsavedDialogOpen(false);
          toast.info('Modifications abandonnées');
        }}
      />
    </div>
  );
}
