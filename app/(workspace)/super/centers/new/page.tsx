'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
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
import { FormFieldWrapper } from '@/components/forms/form-field';
import { PRESET_MODULES } from '@/lib/mock-api/super-admin-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type { CenterInstance } from '@/types/core';

const newCenterSchema = z.object({
  name: z.string().min(3, 'Nom du centre requis (min. 3 caractères)'),
  city: z.string().min(2, 'Ville requise'),
  subdomain: z
    .string()
    .regex(/^[a-z0-9-]{3,24}$/, 'Minuscules, chiffres et tirets uniquement'),
  plan: z.enum(['Essentiel', 'Plus', 'Tout-en-un']),
  siteName: z.string().min(2, 'Nom du site initial requis'),
  roomsCount: z.coerce.number().min(1).max(50),
});

type NewCenterValues = z.infer<typeof newCenterSchema>;

export default function SuperNewCenterPage() {
  const router = useRouter();
  const { createDemoCenter } = useDemoSession();

  const form = useForm<NewCenterValues>({
    resolver: zodResolver(newCenterSchema) as never,
    defaultValues: {
      name: '',
      city: 'Tanger',
      subdomain: '',
      plan: 'Plus',
      siteName: 'Campus Principal',
      roomsCount: 6,
    },
  });

  const onSubmit = (values: NewCenterValues) => {
    const id = `center-custom-${Date.now()}`;
    const shortCode = values.name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
      .padEnd(2, 'M');

    const created: CenterInstance = {
      id,
      name: values.name.trim(),
      city: values.city.trim(),
      plan: values.plan,
      status: 'essai',
      timezone: 'Africa/Casablanca',
      currency: 'MAD',
      localeDefault: 'fr',
      branding: {
        displayName: `${values.name.trim()} — ${values.city.trim()}`,
        shortCode,
        subdomain: `${values.subdomain.trim().toLowerCase()}.markazflow.demo`,
        accentColor: '#0f766e',
      },
      locations: [
        {
          id: `loc-${Date.now()}`,
          name: values.siteName.trim(),
          city: values.city.trim(),
          address: 'Adresse à compléter lors de l’onboarding',
          roomsCount: values.roomsCount,
        },
      ],
      enabledModules: PRESET_MODULES[values.plan],
      metrics: {
        activeStudents: 0,
        newEnrollmentsMonth: 0,
        todaySessionsCount: 0,
        attendanceRatePercent: 0,
        absencesToday: 0,
        collectedRevenueMad: 0,
        pendingReceivablesMad: 0,
        overdueAmountMad: 0,
        estimatedPayrollMad: 0,
      },
      todaySessions: [],
      recentPayments: [],
    };

    createDemoCenter(created);
    toast.success(`Instance « ${created.name} » créée en Mode Démo`, {
      description: `Preset ${values.plan} appliqué (${created.enabledModules.length} modules).`,
    });
    router.push(`/super/centers/${id}/configuration`);
  };

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/super/centers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour à la liste des centres
        </Link>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-xl">
              <Building2 className="size-5 text-primary" />
              Provisionner une nouvelle instance centre (démo)
            </CardTitle>
            <CardDescription>
              Crée un tenant fictif en mémoire locale avec son preset de
              modules initial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <FormFieldWrapper
                id="nc-name"
                label="Nom du centre"
                required
                error={form.formState.errors.name?.message}
              >
                <Input
                  id="nc-name"
                  placeholder="Ex. Centre Ibn Sina"
                  {...form.register('name')}
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                id="nc-city"
                label="Ville"
                required
                error={form.formState.errors.city?.message}
              >
                <Input id="nc-city" {...form.register('city')} />
              </FormFieldWrapper>

              <FormFieldWrapper
                id="nc-subdomain"
                label="Sous-domaine démo"
                required
                error={form.formState.errors.subdomain?.message}
              >
                <Input
                  id="nc-subdomain"
                  placeholder="ibnsina"
                  className="font-mono"
                  {...form.register('subdomain')}
                />
              </FormFieldWrapper>

              <FormFieldWrapper id="nc-plan" label="Preset de plan initial" required>
                <Select
                  value={form.watch('plan')}
                  onValueChange={(val) =>
                    form.setValue(
                      'plan',
                      (val as 'Essentiel' | 'Plus' | 'Tout-en-un') ?? 'Plus'
                    )
                  }
                >
                  <SelectTrigger id="nc-plan" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Essentiel">
                      Essentiel ({PRESET_MODULES.Essentiel.length} modules)
                    </SelectItem>
                    <SelectItem value="Plus">
                      Plus ({PRESET_MODULES.Plus.length} modules)
                    </SelectItem>
                    <SelectItem value="Tout-en-un">
                      Tout-en-un ({PRESET_MODULES['Tout-en-un'].length} modules)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              <FormFieldWrapper
                id="nc-site"
                label="Site principal"
                required
                error={form.formState.errors.siteName?.message}
              >
                <Input id="nc-site" {...form.register('siteName')} />
              </FormFieldWrapper>

              <FormFieldWrapper
                id="nc-rooms"
                label="Nombre de salles"
                required
                error={form.formState.errors.roomsCount?.message}
              >
                <Input
                  id="nc-rooms"
                  type="number"
                  min={1}
                  max={50}
                  {...form.register('roomsCount')}
                />
              </FormFieldWrapper>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Link
                  href="/super/centers"
                  className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
                >
                  Annuler
                </Link>
                <Button type="submit" className="gap-1.5">
                  <Plus className="size-4" />
                  Créer et configurer les modules
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
