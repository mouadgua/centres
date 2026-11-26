'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
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
  INITIAL_SAAS_STAFF,
  type SaasStaffUser,
} from '@/lib/mock-api/super-admin-data';

export default function SuperUsersPage() {
  const [staff, setStaff] = useState<SaasStaffUser[]>(INITIAL_SAAS_STAFF);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [targetUser, setTargetUser] = useState<SaasStaffUser | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 2 || !newEmail.includes('@')) {
      toast.error('Nom et email valide requis');
      return;
    }
    const created: SaasStaffUser = {
      id: `stf-${Date.now()}`,
      fullName: newName.trim(),
      email: newEmail.trim(),
      role: 'Support N2',
      mfaEnabled: false,
      lastActive: 'Invitation démo créée',
      status: 'actif',
    };
    setStaff((prev) => [created, ...prev]);
    setNewName('');
    setNewEmail('');
    toast.success('Compte opérateur SaaS ajouté en mode démo (aucun email envoyé)');
  };

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Utilisateurs SaaS (Équipe Plateforme)
          </h1>
          <p className="text-sm text-muted-foreground">
            Opérateurs habilités à gérer les instances et le support (sans accès
            aux données nominatives élèves).
          </p>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Ajouter un opérateur démo</CardTitle>
            <CardDescription className="text-xs">
              Simulation locale uniquement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleInvite}
              className="flex flex-wrap items-center gap-3"
            >
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom complet"
                className="w-full sm:w-56"
              />
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@markazflow.demo"
                className="w-full sm:w-64"
              />
              <Button type="submit" size="sm" className="gap-1.5">
                <UserPlus className="size-3.5" />
                Ajouter (démo)
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardContent className="divide-y divide-border p-4">
            {staff.map((user) => (
              <div
                key={user.id}
                className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="size-4 text-primary" />
                    {user.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email} · {user.role} · MFA :{' '}
                    {user.mfaEnabled ? 'Simulé actif' : 'Désactivé'} ·{' '}
                    {user.lastActive}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium capitalize ${
                      user.status === 'actif'
                        ? 'text-success'
                        : 'text-destructive'
                    }`}
                  >
                    {user.status}
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setTargetUser(user)}
                  >
                    {user.status === 'actif' ? 'Suspendre' : 'Réactiver'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(targetUser)}
        onOpenChange={(o) => {
          if (!o) setTargetUser(null);
        }}
        variant={targetUser?.status === 'actif' ? 'destructive' : 'default'}
        title={
          targetUser?.status === 'actif'
            ? `Suspendre ${targetUser.fullName} ?`
            : `Réactiver ${targetUser?.fullName} ?`
        }
        description="Action simulée dans le prototype frontend."
        confirmLabel="Confirmer"
        onConfirm={() => {
          if (!targetUser) return;
          setStaff((prev) =>
            prev.map((s) =>
              s.id === targetUser.id
                ? {
                    ...s,
                    status: s.status === 'actif' ? 'suspendu' : 'actif',
                  }
                : s
            )
          );
          toast.success(`Statut mis à jour pour ${targetUser.fullName}`);
          setTargetUser(null);
        }}
      />
    </ModuleGate>
  );
}
