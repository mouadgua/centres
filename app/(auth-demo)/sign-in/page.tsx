'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from '@/components/forms/form-field';
import { DEMO_USERS } from '@/lib/mock-api/demo-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type { RoleId } from '@/types/core';

const signInSchema = z.object({
  email: z.string().email('Adresse email invalide (ex. direction@centre.demo)'),
  password: z
    .string()
    .min(4, 'Saisissez au moins 4 caractères pour la simulation'),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInDemoPage() {
  const router = useRouter();
  const { centers, activeCenter, switchCenter, switchRole } = useDemoSession();
  const [simulatingSuspended, setSimulatingSuspended] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: 'direction@centre.demo',
      password: 'demo-password',
    },
  });

  const handleSimulatedSubmit = async (values: SignInValues) => {
    if (simulatingSuspended) {
      toast.error('Connexion bloquée (simulation centre suspendu)', {
        description:
          'L’instance sélectionnée est marquée en essai expiré / suspendu dans cet aperçu.',
      });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    setSubmitting(false);

    const matchedUser = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === values.email.trim().toLowerCase()
    );
    const roleToUse: RoleId = matchedUser?.role ?? 'director';
    switchRole(roleToUse);
    toast.success('Session Mode Démo activée', {
      description: `Connexion simulée en tant que ${DEMO_USERS[roleToUse].roleLabel}.`,
    });
    router.push(DEMO_USERS[roleToUse].defaultRoute);
  };

  const handleQuickExplore = (role: RoleId) => {
    if (simulatingSuspended && role !== 'super_admin') {
      toast.warning('Instance en mode suspendu (aperçu)', {
        description:
          'Désactivez la simulation d’essai expiré ou connectez-vous en Super Admin.',
      });
      return;
    }
    switchRole(role);
    toast.info(`Profil démo : ${DEMO_USERS[role].roleLabel}`);
    router.push(DEMO_USERS[role].defaultRoute);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: Simulated login form + suspended preview */}
      <div className="space-y-4 lg:col-span-5">
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              Connexion à un espace démo
            </CardTitle>
            <CardDescription>
              Saisissez n&apos;importe quel email valide ou choisissez un profil
              préconfiguré à droite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {simulatingSuspended ? (
              <div
                role="alert"
                className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Essai expiré / Centre suspendu (aperçu)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      L&apos;instance <strong>{activeCenter.name}</strong> est
                      temporairement suspendue suite à une simulation d&apos;essai
                      expiré. Contactez l&apos;administration SaaS pour réactiver
                      l&apos;accès.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setSimulatingSuspended(false)}
                  >
                    Revenir à l&apos;état actif
                  </Button>
                  <Link
                    href="/contact"
                    className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground"
                  >
                    Contacter le support démo
                  </Link>
                </div>
              </div>
            ) : null}

            <form
              onSubmit={form.handleSubmit(handleSimulatedSubmit)}
              className="space-y-4"
            >
              <FormFieldWrapper
                id="signin-email"
                label="Email professionnel ou identifiant démo"
                required
                error={form.formState.errors.email?.message}
              >
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="username"
                  {...form.register('email')}
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                id="signin-password"
                label="Mot de passe (factice en démo)"
                required
                error={form.formState.errors.password?.message}
              >
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  {...form.register('password')}
                />
              </FormFieldWrapper>

              <div className="flex items-center justify-between text-xs">
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
                <Link
                  href="/verify"
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  Vérifier un code / invitation
                </Link>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                Entrer dans la démo
              </Button>
            </form>

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setSimulatingSuspended((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <AlertTriangle className="size-3.5 text-warning" />
                {simulatingSuspended
                  ? 'Masquer l’écran « essai expiré / suspendu »'
                  : 'Simuler l’écran « essai expiré / centre suspendu »'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Quick role & center explorer */}
      <div className="space-y-4 lg:col-span-7">
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              1. Choisir l&apos;instance de centre active
            </CardTitle>
            <CardDescription className="text-xs">
              La configuration des modules diffère d&apos;un centre à
              l&apos;autre.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-3">
            {centers.map((center) => {
              const selected = center.id === activeCenter.id;
              return (
                <button
                  key={center.id}
                  type="button"
                  onClick={() => switchCenter(center.id)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Building2 className="size-3.5 text-primary" />
                      {center.name}
                    </span>
                    {selected && (
                      <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {center.plan} · {center.enabledModules.length} modules
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              2. Explorer comme l&apos;un des 7 profils fictifs
            </CardTitle>
            <CardDescription className="text-xs">
              La barre latérale et les autorisations UX s&apos;adaptent
              immédiatement au rôle choisi.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            {(Object.keys(DEMO_USERS) as RoleId[]).map((roleKey) => {
              const user = DEMO_USERS[roleKey];
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleQuickExplore(roleKey)}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <UserCheck className="size-3.5 text-primary" />
                      {user.roleLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.fullName} · {user.email}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
