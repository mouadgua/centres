'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ALL_MODULES, DEMO_USERS } from '@/lib/mock-api/demo-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type { RoleId } from '@/types/core';

export default function DemoControlPage() {
  const router = useRouter();
  const { theme = 'system', setTheme } = useTheme();
  const {
    activeRole,
    activeUser,
    activeCenter,
    centers,
    reducedMotion,
    switchRole,
    switchCenter,
    setReducedMotion,
    toggleCenterModule,
    resetDemo,
  } = useDemoSession();

  const handleSelectRole = (role: RoleId) => {
    switchRole(role);
    toast.success(`Profil actif : ${DEMO_USERS[role].roleLabel}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Accueil
            </Link>
            <span aria-hidden="true" className="text-muted-foreground/50">
              /
            </span>
            <h1 className="font-heading text-sm font-semibold">
              Console Mode Démo
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetDemo();
                toast.success('État de démonstration réinitialisé');
              }}
            >
              <RotateCcw className="size-3.5" />
              Reset démo
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push(activeUser.defaultRoute)}
            >
              Ouvrir l&apos;espace
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {/* Theme & Accessibility controls */}
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Apparence et accessibilité</CardTitle>
            <CardDescription>
              Testez les thèmes Clair / Sombre / Système et la réduction des
              animations sans rechargement de page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
              >
                <Sun className="size-3.5" />
                Clair
              </Button>
              <Button
                type="button"
                size="sm"
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                <Moon className="size-3.5" />
                Sombre
              </Button>
              <Button
                type="button"
                size="sm"
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
              >
                <Monitor className="size-3.5" />
                Système
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="demo-reduce-motion"
                checked={reducedMotion}
                onCheckedChange={(v) => setReducedMotion(Boolean(v))}
              />
              <Label htmlFor="demo-reduce-motion" className="text-sm">
                Réduire les animations
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Role Picker */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">
            1. Profil actif ({activeUser.roleLabel})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(DEMO_USERS).map((user) => {
              const selected = user.role === activeRole;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectRole(user.role)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold">{user.roleLabel}</span>
                    {selected && <Check className="size-4 text-primary" />}
                  </div>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {user.fullName}
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {user.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Center Preset Picker */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">
            2. Instance de centre ({activeCenter.name})
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {centers.map((c) => {
              const selected = c.id === activeCenter.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    switchCenter(c.id);
                    toast.success(`Centre actif : ${c.name}`);
                  }}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                      <Building2 className="size-4 text-muted-foreground" />
                      {c.name}
                    </span>
                    {selected && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.city} · Plan {c.plan} · {c.enabledModules.length} modules
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick Module Override Preview for testing ModuleGate */}
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              3. Aperçu des modules actifs sur {activeCenter.name}
            </CardTitle>
            <CardDescription>
              Activez ou désactivez un module clé ci-dessous pour vérifier en
              direct la mise à jour de la sidebar et de l&apos;écran{' '}
              <code className="font-mono">ModuleGate</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_MODULES.filter((m) =>
              [
                'students',
                'attendance.qr',
                'parent.portal',
                'messaging.whatsapp',
                'payroll',
                'dataStudio',
                'calendar.internal',
                'documents.students',
                'feedback',
              ].includes(m.key)
            ).map((mod) => {
              const enabled = activeCenter.enabledModules.includes(mod.key);
              return (
                <div
                  key={mod.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{mod.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {mod.group} · Plan {mod.planRequirement}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    aria-label={`Activer ${mod.name}`}
                    onCheckedChange={() => {
                      toggleCenterModule(activeCenter.id, mod.key);
                      toast.info(
                        `${mod.name} ${enabled ? 'désactivé' : 'activé'} sur ${activeCenter.name}`
                      );
                    }}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
