'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from '@/components/feedback/unsaved-changes-guard';
import { FormFieldWrapper, PhoneInputMA } from '@/components/forms/form-field';
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
import { Textarea } from '@/components/ui/textarea';
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { StudentRecord } from '@/types/profiles';

const studentSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  level: z.string().min(2, 'Niveau scolaire requis'),
  phone: z.string().min(8, 'Téléphone marocain requis'),
  siteName: z.string().min(2, 'Site requis'),
  groupName: z.string().min(2, 'Groupe initial requis'),
  guardianId: z.string(),
  discountPercent: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function AdminNewStudentPage() {
  const router = useRouter();
  const { activeCenter } = useDemoSession();
  const { guardians, addStudent } = useProfilesStore();
  const [exitOpen, setExitOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(true);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema) as never,
    defaultValues: {
      firstName: '',
      lastName: '',
      level: '2ème Bac',
      phone: '',
      siteName: activeCenter.locations[0]?.name ?? 'Site principal',
      groupName: '2Bac PC — Excellence',
      guardianId: guardians[0]?.id ?? 'none',
      discountPercent: 0,
      notes: '',
    },
  });

  useUnsavedChangesGuard(form.formState.isDirty);

  const onSubmit = (values: StudentFormValues) => {
    const id = `stu-${Date.now()}`;
    const code = `ELV-2026-${Math.floor(300 + Math.random() * 699)}`;
    const initials =
      `${values.firstName.trim()[0] ?? ''}${values.lastName.trim()[0] ?? ''}`.toUpperCase();

    const record: StudentRecord = {
      id,
      centerId: activeCenter.id,
      code,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      initials: initials || 'EL',
      level: values.level,
      groupNames: [values.groupName],
      guardianIds:
        values.guardianId && values.guardianId !== 'none'
          ? [values.guardianId]
          : [],
      phone: `+212 ${values.phone.trim()}`,
      siteName: values.siteName,
      status: 'actif',
      balanceMad: 0,
      attendanceRatePercent: 100,
      lastAttendanceLabel: 'Nouvelle inscription',
      enrolledAt: "Aujourd'hui",
      discountPercent: values.discountPercent,
      notes: values.notes?.trim() ?? '',
    };

    addStudent(record);
    toast.success(`Élève ${record.firstName} ${record.lastName} créé`, {
      description: `Dossier ${code} enregistré en Mode Démo.`,
      action: {
        label: 'Ouvrir fiche',
        onClick: () => router.push(`/admin/students/${id}`),
      },
    });
    router.push(`/admin/students/${id}`);
  };

  return (
    <ModuleGate moduleKey="students" allowedRoles={['director', 'secretary']}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (form.formState.isDirty) setExitOpen(true);
              else router.push('/admin/students');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour à la liste des élèves
          </button>
          <span className="text-xs text-muted-foreground">
            {activeCenter.name} · Mode Démo
          </span>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-xl">
              <UserPlus className="size-5 text-primary" />
              Nouvel élève (création guidée)
            </CardTitle>
            <CardDescription>
              Renseignez l&apos;identité fictive, l&apos;affectation pédagogique
              et le responsable légal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormFieldWrapper
                  id="stu-first"
                  label="Prénom"
                  required
                  error={form.formState.errors.firstName?.message}
                >
                  <Input
                    id="stu-first"
                    placeholder="Ex. Sofia"
                    {...form.register('firstName')}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="stu-last"
                  label="Nom"
                  required
                  error={form.formState.errors.lastName?.message}
                >
                  <Input
                    id="stu-last"
                    placeholder="Ex. Mansouri"
                    {...form.register('lastName')}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="stu-phone"
                  label="Téléphone"
                  required
                  error={form.formState.errors.phone?.message}
                >
                  <PhoneInputMA
                    id="stu-phone"
                    {...form.register('phone')}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper id="stu-level" label="Niveau scolaire" required>
                  <Select
                    value={form.watch('level')}
                    onValueChange={(v) =>
                      form.setValue('level', v ?? '2ème Bac', {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="stu-level" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Collège">Collège</SelectItem>
                      <SelectItem value="Tronc Commun">Tronc Commun</SelectItem>
                      <SelectItem value="1ère Bac">1ère Bac</SelectItem>
                      <SelectItem value="2ème Bac">2ème Bac</SelectItem>
                      <SelectItem value="Sup MPSI">Sup MPSI</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper id="stu-site" label="Site d'attache" required>
                  <Select
                    value={form.watch('siteName')}
                    onValueChange={(v) =>
                      form.setValue(
                        'siteName',
                        v ?? activeCenter.locations[0]?.name ?? '',
                        { shouldDirty: true }
                      )
                    }
                  >
                    <SelectTrigger id="stu-site" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCenter.locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.name}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper id="stu-group" label="Groupe initial" required>
                  <Select
                    value={form.watch('groupName')}
                    onValueChange={(v) =>
                      form.setValue('groupName', v ?? '2Bac PC — Excellence', {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="stu-group" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2Bac PC — Excellence">
                        2Bac PC — Excellence
                      </SelectItem>
                      <SelectItem value="2Bac SM — Groupe A">
                        2Bac SM — Groupe A
                      </SelectItem>
                      <SelectItem value="1ère Bac Régional — A">
                        1ère Bac Régional — A
                      </SelectItem>
                      <SelectItem value="Sup MPSI — Intensif">
                        Sup MPSI — Intensif
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="stu-guardian"
                  label="Responsable familial associé"
                >
                  <Select
                    value={form.watch('guardianId')}
                    onValueChange={(v) =>
                      form.setValue('guardianId', v ?? 'none', {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="stu-guardian" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Associer ultérieurement
                      </SelectItem>
                      {guardians.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.firstName} {g.lastName} ({g.relation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="stu-discount"
                  label="Remise éventuelle (%)"
                  error={form.formState.errors.discountPercent?.message}
                >
                  <Input
                    id="stu-discount"
                    type="number"
                    min={0}
                    max={100}
                    {...form.register('discountPercent')}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="stu-notes"
                  label="Notes pédagogiques / administratives"
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="stu-notes"
                    rows={2}
                    placeholder="Ex. remise fratrie, objectif concours..."
                    {...form.register('notes')}
                  />
                </FormFieldWrapper>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5 text-xs">
                <Checkbox
                  id="stu-consent"
                  checked={consentChecked}
                  onCheckedChange={(v) => setConsentChecked(Boolean(v))}
                />
                <Label htmlFor="stu-consent" className="leading-relaxed">
                  Générer des identifiants portail étudiant fictifs (Mode Démo —
                  aucun compte réel ni email envoyé).
                </Label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <Link
                  href="/admin/students"
                  className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
                >
                  Annuler
                </Link>
                <Button type="submit" className="gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Créer la fiche élève
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        onDiscard={() => {
          setExitOpen(false);
          router.push('/admin/students');
        }}
      />
    </ModuleGate>
  );
}
