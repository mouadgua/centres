'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
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
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { TeacherRecord } from '@/types/profiles';

const newTeacherSchema = z.object({
  fullName: z.string().min(3, 'Nom complet requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Téléphone requis'),
  subject: z.string().min(2, 'Matière requise'),
  compType: z.enum(['horaire', 'fixe', 'pourcentage']),
  rateValue: z.coerce.number().min(10, 'Valeur requise'),
});

type NewTeacherValues = z.infer<typeof newTeacherSchema>;

export default function AdminTeachersPage() {
  const { activeCenter, activeRole, hasModule } = useDemoSession();
  const { teachers, addTeacher } = useProfilesStore();
  const [newOpen, setNewOpen] = useState(false);

  const canSeeComp =
    (activeRole === 'director' || activeRole === 'accountant') &&
    hasModule('payroll');

  const form = useForm<NewTeacherValues>({
    resolver: zodResolver(newTeacherSchema) as never,
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      subject: 'Mathématiques',
      compType: 'horaire',
      rateValue: 250,
    },
  });

  const columns = useMemo<ColumnDef<TeacherRecord>[]>(() => {
    const base: ColumnDef<TeacherRecord>[] = [
      {
        accessorKey: 'fullName',
        header: 'Professeur',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {row.original.initials}
            </span>
            <div>
              <Link
                href={`/admin/teachers/${row.original.id}`}
                className="font-medium hover:text-primary hover:underline"
              >
                {row.original.fullName}
              </Link>
              <p className="text-[11px] text-muted-foreground">
                {row.original.subjects.join(', ')} · {row.original.sites.join(', ')}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'groups',
        header: 'Groupes & disponibilités',
        cell: ({ row }) => (
          <div>
            <p className="text-xs font-medium">
              {row.original.groups.join(' · ') || 'À affecter'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.availabilitySummary}
            </p>
          </div>
        ),
      },
      {
        id: 'sessions',
        header: 'Séances (mois)',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums">
            {row.original.completedSessionsMonth} /{' '}
            {row.original.plannedSessionsMonth}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => (
          <span
            className={`text-xs font-medium capitalize ${
              row.original.status === 'actif'
                ? 'text-success'
                : 'text-warning'
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
    ];

    if (canSeeComp) {
      base.push({
        accessorKey: 'estimatedPayMad',
        header: 'Rémunération est. (démo)',
        cell: ({ row }) => {
          const t = row.original;
          const formula =
            t.compType === 'horaire'
              ? `${t.rateValue} MAD/h`
              : t.compType === 'fixe'
                ? 'Forfait mensuel'
                : `${t.rateValue} % CA groupe`;
          return (
            <div>
              <p className="font-mono text-xs font-semibold tabular-nums">
                {formatMAD(t.estimatedPayMad)}
              </p>
              <p className="text-[11px] text-muted-foreground">{formula}</p>
            </div>
          );
        },
      });
    }

    base.push({
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          href={`/admin/teachers/${row.original.id}`}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
        >
          Ouvrir fiche
        </Link>
      ),
    });

    return base;
  }, [canSeeComp]);

  const onSubmit = (values: NewTeacherValues) => {
    const cleanName = values.fullName.trim();
    const parts = cleanName.replace(/^Prof\.?\s+/i, '').split(/\s+/);
    const initials = `${parts[0]?.[0] ?? 'P'}${parts[1]?.[0] ?? 'R'}`.toUpperCase();

    const created: TeacherRecord = {
      id: `tea-${Date.now()}`,
      centerId: activeCenter.id,
      fullName: cleanName.startsWith('Prof.') ? cleanName : `Prof. ${cleanName}`,
      initials,
      email: values.email.trim(),
      phone: `+212 ${values.phone.trim()}`,
      subjects: [values.subject],
      groups: [],
      sites: [activeCenter.locations[0]?.name ?? 'Site principal'],
      availabilitySummary: 'Disponibilités à définir',
      compType: values.compType,
      rateValue: values.rateValue,
      plannedSessionsMonth: 0,
      completedSessionsMonth: 0,
      estimatedPayMad: values.compType === 'fixe' ? values.rateValue : 0,
      status: 'actif',
    };
    addTeacher(created);
    setNewOpen(false);
    form.reset();
    toast.success(`${created.fullName} ajouté en Mode Démo`);
  };

  return (
    <ModuleGate moduleKey="teachers" allowedRoles={['director', 'secretary']}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Professeurs — {activeCenter.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Matières, disponibilités, groupes affectés et estimation de
              rémunération indicative.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setNewOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Nouveau professeur
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={teachers}
          searchPlaceholder="Rechercher un professeur, une matière..."
          facetColumnId="status"
          facetOptions={[
            { value: 'actif', label: 'Actifs' },
            { value: 'conge', label: 'Congé' },
            { value: 'suspendu', label: 'Suspendus' },
          ]}
          renderMobileCard={(t) => (
            <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/teachers/${t.id}`}
                  className="font-semibold hover:text-primary"
                >
                  {t.fullName}
                </Link>
                <span className="text-xs capitalize text-muted-foreground">
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.subjects.join(', ')} · {t.completedSessionsMonth}/
                {t.plannedSessionsMonth} séances
              </p>
              <Link
                href={`/admin/teachers/${t.id}`}
                className="inline-block pt-1 text-xs font-medium text-primary"
              >
                Ouvrir fiche →
              </Link>
            </div>
          )}
          emptyTitle="Aucun professeur sur ce centre"
          emptyDescription="Ajoutez un premier enseignant pour planifier des séances."
        />
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau professeur (Mode Démo)</DialogTitle>
            <DialogDescription className="text-xs">
              Aucune invitation email réelle n&apos;est envoyée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormFieldWrapper
              id="nt-name"
              label="Nom complet"
              required
              error={form.formState.errors.fullName?.message}
            >
              <Input
                id="nt-name"
                placeholder="Ex. Nadia El Mansouri"
                {...form.register('fullName')}
              />
            </FormFieldWrapper>
            <FormFieldWrapper
              id="nt-email"
              label="Email"
              required
              error={form.formState.errors.email?.message}
            >
              <Input
                id="nt-email"
                type="email"
                placeholder="n.mansouri@centre.demo"
                {...form.register('email')}
              />
            </FormFieldWrapper>
            <FormFieldWrapper
              id="nt-phone"
              label="Téléphone"
              required
              error={form.formState.errors.phone?.message}
            >
              <PhoneInputMA id="nt-phone" {...form.register('phone')} />
            </FormFieldWrapper>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormFieldWrapper id="nt-sub" label="Matière principale">
                <Input id="nt-sub" {...form.register('subject')} />
              </FormFieldWrapper>
              <FormFieldWrapper id="nt-comp" label="Mode rémunération">
                <Select
                  value={form.watch('compType')}
                  onValueChange={(v) =>
                    form.setValue(
                      'compType',
                      (v as 'horaire' | 'fixe' | 'pourcentage') ?? 'horaire'
                    )
                  }
                >
                  <SelectTrigger id="nt-comp" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horaire">Horaire (MAD/h)</SelectItem>
                    <SelectItem value="fixe">Forfait mensuel (MAD)</SelectItem>
                    <SelectItem value="pourcentage">Pourcentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>
            <FormFieldWrapper
              id="nt-rate"
              label="Taux / Montant / % indicatif"
              error={form.formState.errors.rateValue?.message}
            >
              <Input
                id="nt-rate"
                type="number"
                {...form.register('rateValue')}
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
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleGate>
  );
}
