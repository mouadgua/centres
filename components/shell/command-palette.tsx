'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Command } from 'cmdk';
import {
  Building2,
  Clock,
  Layers,
  Monitor,
  Moon,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatMAD } from '@/lib/format/morocco';
import { getFilteredNavGroups } from '@/lib/permissions/navigation';
import { useDemoSession } from '@/stores/demo-session-context';
import { NavIcon } from '@/components/shell/nav-icon';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const {
    activeRole,
    activeUser,
    activeCenter,
    reducedMotion,
    setReducedMotion,
    resetDemo,
    hasModule,
  } = useDemoSession();

  const navGroups = getFilteredNavGroups(
    activeRole,
    activeCenter.enabledModules
  );

  const canSeePayments =
    (activeRole === 'director' || activeRole === 'accountant') &&
    hasModule('billing');
  const canSeeSessions =
    activeRole !== 'accountant' && hasModule('sessions');

  const navigateTo = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Palette de commandes</DialogTitle>
          <DialogDescription>
            Recherchez une page, une donnée démo ou une action rapide.
          </DialogDescription>
        </DialogHeader>
        <Command className="flex flex-col bg-popover text-popover-foreground">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder={`Rechercher (${activeUser.roleLabel} · ${activeCenter.name})...`}
              className="flex h-11 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              Aucun résultat pour ce profil ou cette instance.
            </Command.Empty>

            {/* Navigation groups */}
            {navGroups.map((group) => (
              <Command.Group
                key={group.id}
                heading={group.label}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {group.items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${group.label} ${item.href}`}
                    onSelect={() => navigateTo(item.href)}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <span className="flex items-center gap-2.5">
                      <NavIcon
                        name={item.iconName}
                        className="size-4 text-muted-foreground"
                      />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {group.label}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}

            {/* Demo data items filtered by role & modules */}
            {canSeeSessions && activeCenter.todaySessions.length > 0 && (
              <Command.Group
                heading="Séances du jour (démo)"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {activeCenter.todaySessions.map((ses) => (
                  <Command.Item
                    key={ses.id}
                    value={`${ses.title} ${ses.teacherName} ${ses.groupName}`}
                    onSelect={() =>
                      navigateTo(
                        activeRole === 'teacher'
                          ? '/teacher/sessions'
                          : '/admin/sessions'
                      )
                    }
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Clock className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{ses.title}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {ses.startTime}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {canSeePayments && activeCenter.recentPayments.length > 0 && (
              <Command.Group
                heading="Encaissements récents (démo)"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {activeCenter.recentPayments.map((pay) => (
                  <Command.Item
                    key={pay.id}
                    value={`${pay.reference} ${pay.studentName} ${pay.method}`}
                    onSelect={() => navigateTo('/admin/payments')}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Wallet className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {pay.studentName} · {pay.reference}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatMAD(pay.amountMad)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* System & UI Kit Actions */}
            <Command.Group
              heading="Outils & Apparence"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              <Command.Item
                value="Galerie UI Kit composants Storybook"
                onSelect={() => navigateTo('/admin/ui-kit')}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Layers className="size-4 text-muted-foreground" />
                <span>Galerie UI Kit (Lot 2)</span>
              </Command.Item>
              <Command.Item
                value="Console Mode Démo changer rôle centre"
                onSelect={() => navigateTo('/demo')}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Sparkles className="size-4 text-muted-foreground" />
                <span>Console Mode Démo & Rôles</span>
              </Command.Item>
              <Command.Item
                value="Thème Clair Light"
                onSelect={() => {
                  setTheme('light');
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Sun className="size-4 text-muted-foreground" />
                <span>Passer au thème Clair</span>
              </Command.Item>
              <Command.Item
                value="Thème Sombre Dark"
                onSelect={() => {
                  setTheme('dark');
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Moon className="size-4 text-muted-foreground" />
                <span>Passer au thème Sombre</span>
              </Command.Item>
              <Command.Item
                value="Thème Système"
                onSelect={() => {
                  setTheme('system');
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Monitor className="size-4 text-muted-foreground" />
                <span>Suivre le thème Système</span>
              </Command.Item>
              <Command.Item
                value="Réduire les animations accessibilité"
                onSelect={() => {
                  setReducedMotion(!reducedMotion);
                  toast.info(
                    !reducedMotion
                      ? 'Animations réduites activées'
                      : 'Animations standard restaurées'
                  );
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Building2 className="size-4 text-muted-foreground" />
                <span>
                  {reducedMotion
                    ? 'Réactiver les animations'
                    : 'Réduire les animations'}
                </span>
              </Command.Item>
              <Command.Item
                value="Réinitialiser données démo reset"
                onSelect={() => {
                  resetDemo();
                  toast.success('Données de démonstration réinitialisées');
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <RotateCcw className="size-4 text-muted-foreground" />
                <span>Réinitialiser la démo</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
