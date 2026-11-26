'use client';

import React, { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ShieldAlert, ShieldCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { GlobalBanner } from '@/components/feedback/states';
import { DataTable } from '@/components/tables/data-table';
import { FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { PermissionMatrixEntry, StaffMemberRecord } from '@/types/profiles';

export default function AdminUsersPermissionsPage() {
  const { activeCenter } = useDemoSession();
  const {
    staffMembers,
    permissionMatrix,
    addStaffMember,
    updateStaffMember,
    togglePermissionCell,
  } = useProfilesStore();

  const [selectedRoleTab, setSelectedRoleTab] =
    useState<StaffMemberRecord['role']>('secretary');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<StaffMemberRecord['role']>('secretary');
  const [revokeTarget, setRevokeTarget] = useState<StaffMemberRecord | null>(
    null
  );
  const [pendingMatrixChange, setPendingMatrixChange] = useState<{
    role: StaffMemberRecord['role'];
    moduleId: string;
    moduleLabel: string;
    field: keyof Omit<PermissionMatrixEntry, 'moduleId' | 'moduleLabel'>;
  } | null>(null);

  const columns = useMemo<ColumnDef<StaffMemberRecord>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Collaborateur',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'roleLabel',
        header: 'Rôle',
        cell: ({ row }) => (
          <span className="text-xs font-medium">{row.original.roleLabel}</span>
        ),
      },
      {
        accessorKey: 'sitesScope',
        header: 'Portée sites',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.sitesScope}
          </span>
        ),
      },
      {
        accessorKey: 'mfaEnabled',
        header: 'MFA (illustratif)',
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.mfaEnabled ? 'Activé (démo)' : 'Non configuré'}
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
                : 'text-destructive'
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={row.original.role === 'director'}
            onClick={() => setRevokeTarget(row.original)}
          >
            {row.original.status === 'actif' ? 'Suspendre accès' : 'Réactiver'}
          </Button>
        ),
      },
    ],
    []
  );

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 2 || !newEmail.includes('@')) {
      toast.error('Nom et email valide requis');
      return;
    }
    const roleLabels: Record<StaffMemberRecord['role'], string> = {
      director: 'Directeur de centre',
      secretary: 'Secrétaire / Accueil',
      accountant: 'Comptable',
      coordinator: 'Coordinateur pédagogique',
    };
    addStaffMember({
      id: `stf-${Date.now()}`,
      centerId: activeCenter.id,
      fullName: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      roleLabel: roleLabels[newRole],
      sitesScope: activeCenter.locations[0]?.name ?? 'Tous les sites',
      mfaEnabled: false,
      status: 'actif',
      lastLogin: 'Invitation démo préparée',
    });
    setInviteOpen(false);
    setNewName('');
    setNewEmail('');
    toast.success('Collaborateur ajouté (simulation — aucun email envoyé)');
  };

  const matrixRows = permissionMatrix[selectedRoleTab] ?? [];

  return (
    <ModuleGate moduleKey="staff" allowedRoles={['director']}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Utilisateurs &amp; matrice d&apos;accès — {activeCenter.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Comptes internes du centre et délégation de permissions par rôle.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="size-3.5" />
            Ajouter collaborateur (démo)
          </Button>
        </div>

        <GlobalBanner
          tone="warning"
          title="Simulation UX des permissions (effet côté serveur à implémenter)"
          description="Les cases ci-dessous modélisent l'interface de gestion des droits. En production, chaque action et export sensible devra être vérifié par le backend."
        />

        <DataTable
          columns={columns}
          data={staffMembers}
          searchPlaceholder="Rechercher un membre du staff..."
        />

        <Card className="border-border shadow-none">
          <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-primary" />
                Matrice d&apos;autorisations par rôle
              </CardTitle>
              <CardDescription className="text-xs">
                Chaque modification critique demande confirmation.
              </CardDescription>
            </div>
            <Select
              value={selectedRoleTab}
              onValueChange={(v) =>
                setSelectedRoleTab(
                  (v as StaffMemberRecord['role']) ?? 'secretary'
                )
              }
            >
              <SelectTrigger className="w-56 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="director">Directeur</SelectItem>
                <SelectItem value="secretary">Secrétaire / Accueil</SelectItem>
                <SelectItem value="accountant">Comptable</SelectItem>
                <SelectItem value="coordinator">
                  Coordinateur pédagogique
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2.5 pr-4 font-medium">Domaine</th>
                  <th className="px-3 py-2.5 text-center font-medium">Voir</th>
                  <th className="px-3 py-2.5 text-center font-medium">Créer</th>
                  <th className="px-3 py-2.5 text-center font-medium">
                    Modifier
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium">
                    Archiver
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium">
                    Exporter
                  </th>
                  <th className="px-3 py-2.5 text-center font-medium">
                    Valider paie/finance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrixRows.map((row) => (
                  <tr key={row.moduleId}>
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {row.moduleLabel}
                    </td>
                    {(
                      [
                        'view',
                        'create',
                        'edit',
                        'archive',
                        'exportData',
                        'validateFinance',
                      ] as const
                    ).map((field) => (
                      <td key={field} className="px-3 py-3 text-center">
                        <Checkbox
                          checked={row[field]}
                          disabled={selectedRoleTab === 'director'}
                          aria-label={`${row.moduleLabel} — ${field}`}
                          onCheckedChange={() =>
                            setPendingMatrixChange({
                              role: selectedRoleTab,
                              moduleId: row.moduleId,
                              moduleLabel: row.moduleLabel,
                              field,
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Invite Staff Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau compte collaborateur (démo)</DialogTitle>
            <DialogDescription className="text-xs">
              Aucune invitation email réelle ne sera envoyée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteStaff} className="space-y-4">
            <FormFieldWrapper id="st-name" label="Nom complet" required>
              <Input
                id="st-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </FormFieldWrapper>
            <FormFieldWrapper id="st-email" label="Email" required>
              <Input
                id="st-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </FormFieldWrapper>
            <FormFieldWrapper id="st-role" label="Rôle">
              <Select
                value={newRole}
                onValueChange={(v) =>
                  setNewRole((v as StaffMemberRecord['role']) ?? 'secretary')
                }
              >
                <SelectTrigger id="st-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="secretary">Secrétaire / Accueil</SelectItem>
                  <SelectItem value="accountant">Comptable</SelectItem>
                  <SelectItem value="coordinator">
                    Coordinateur pédagogique
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke / Suspend Staff ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
        variant={revokeTarget?.status === 'actif' ? 'destructive' : 'default'}
        requireReason={revokeTarget?.status === 'actif'}
        title={
          revokeTarget?.status === 'actif'
            ? `Suspendre l'accès de ${revokeTarget?.fullName} ?`
            : `Réactiver l'accès de ${revokeTarget?.fullName} ?`
        }
        description="Simule la révocation de session UX (le contrôle réel s'applique côté serveur)."
        confirmLabel="Confirmer"
        onConfirm={() => {
          if (!revokeTarget) return;
          updateStaffMember(revokeTarget.id, {
            status: revokeTarget.status === 'actif' ? 'suspendu' : 'actif',
          });
          toast.success(`Accès mis à jour pour ${revokeTarget.fullName}`);
          setRevokeTarget(null);
        }}
      />

      {/* Permission Matrix Change ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(pendingMatrixChange)}
        onOpenChange={(o) => {
          if (!o) setPendingMatrixChange(null);
        }}
        title="Modifier une permission de rôle ?"
        description={
          pendingMatrixChange
            ? `Bascule du droit « ${pendingMatrixChange.field} » sur « ${pendingMatrixChange.moduleLabel} » pour le rôle ${pendingMatrixChange.role}. Effet côté serveur à implémenter en production.`
            : ''
        }
        confirmLabel="Appliquer (démo)"
        onConfirm={() => {
          if (!pendingMatrixChange) return;
          togglePermissionCell(
            pendingMatrixChange.role,
            pendingMatrixChange.moduleId,
            pendingMatrixChange.field
          );
          toast.success('Matrice d’autorisations mise à jour (Mode Démo)');
          setPendingMatrixChange(null);
        }}
      />

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="size-3.5 shrink-0" />
        <span>
          Les autorisations UX ne remplacent jamais le contrôle d&apos;accès
          backend.
        </span>
      </div>
    </ModuleGate>
  );
}
