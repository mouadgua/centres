'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCheck,
  Info,
  MailOpen,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { EmptyState, GlobalBanner } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useDemoSession } from '@/stores/demo-session-context';

type NotifFilter = 'all' | 'unread' | 'alert' | 'warning' | 'info';

export default function AdminNotificationsPage() {
  const {
    notifications,
    unreadCount,
    activeCenter,
    markAllNotificationsRead,
    toggleNotificationRead,
    deleteNotification,
    addNotification,
    restoreNotifications,
  } = useDemoSession();

  const [filter, setFilter] = useState<NotifFilter>('all');
  const [search, setSearch] = useState('');
  const [prefs, setPrefs] = useState({
    inApp: true,
    duesReminder: true,
    repeatedAbsences: true,
    quietHours: true,
  });

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread' && n.read) return false;
      if (filter === 'alert' && n.type !== 'alert') return false;
      if (filter === 'warning' && n.type !== 'warning') return false;
      if (
        filter === 'info' &&
        n.type !== 'info' &&
        n.type !== 'success'
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notifications, filter, search]);

  const handleDeleteWithUndo = (id: string, title: string) => {
    const snapshot = [...notifications];
    deleteNotification(id);
    toast.success(`Notification supprimée : ${title}`, {
      action: {
        label: 'Annuler',
        onClick: () => {
          restoreNotifications(snapshot);
          toast.info('Notification restaurée');
        },
      },
    });
  };

  const handleSimulateNotification = () => {
    const id = `notif-sim-${Date.now()}`;
    addNotification({
      id,
      title: `Absence répétée détectée — ${activeCenter.name}`,
      description:
        'Un élève a cumulé 2 absences consécutives cette semaine (simulation démo sans envoi externe).',
      type: 'alert',
      timeLabel: "À l'instant",
      read: false,
      href: '/admin/attendance',
    });
    toast.warning('Nouvelle alerte de démonstration ajoutée');
  };

  return (
    <ModuleGate
      moduleKey="notifications"
      allowedRoles={['director', 'secretary', 'accountant']}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Centre de notifications
            </h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount} non lue(s) sur {notifications.length} notification(s) ·{' '}
              {activeCenter.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateNotification}
            >
              <Plus className="size-3.5" />
              Simuler une alerte
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={unreadCount === 0}
              onClick={() => {
                markAllNotificationsRead();
                toast.success('Toutes les notifications ont été marquées comme lues');
              }}
            >
              <CheckCheck className="size-3.5" />
              Tout marquer comme lu
            </Button>
          </div>
        </div>

        <GlobalBanner
          tone="info"
          title="Alertes et rappels simulés en Mode Démo"
          description="Les notifications affichées reflètent les modules activés sur l'instance courante. Aucun envoi email, SMS ou WhatsApp réel n'est déclenché."
        />

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filtrer les notifications"
            className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/50 p-0.5"
          >
            {(
              [
                { id: 'all', label: 'Toutes' },
                { id: 'unread', label: 'Non lues' },
                { id: 'alert', label: 'Alertes' },
                { id: 'warning', label: 'Échéances' },
                { id: 'info', label: 'Infos & Succès' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                  filter === tab.id
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer les notifications..."
              aria-label="Filtrer les notifications"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Feed */}
          <div className="space-y-3 lg:col-span-2">
            {filtered.length === 0 ? (
              <EmptyState
                variant={search || filter !== 'all' ? 'no-results' : 'empty'}
                icon={<Bell className="size-5" />}
                title={
                  search || filter !== 'all'
                    ? 'Aucune notification correspondante'
                    : 'Boîte de notifications vide'
                }
                description={
                  search || filter !== 'all'
                    ? 'Modifiez ou réinitialisez vos filtres pour voir les autres alertes.'
                    : 'Les prochains événements (absences, échéances, reçus) apparaîtront ici.'
                }
                actionLabel={
                  search || filter !== 'all'
                    ? 'Réinitialiser les filtres'
                    : 'Simuler une alerte'
                }
                onAction={() => {
                  if (search || filter !== 'all') {
                    setFilter('all');
                    setSearch('');
                  } else {
                    handleSimulateNotification();
                  }
                }}
              />
            ) : (
              <Card className="divide-y divide-border border-border shadow-none">
                {filtered.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex flex-col justify-between gap-3 p-4 transition-colors sm:flex-row sm:items-start',
                      !notif.read && 'bg-primary/[0.03]'
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                          notif.type === 'alert'
                            ? 'bg-destructive/10 text-destructive'
                            : notif.type === 'warning'
                              ? 'bg-warning/15 text-warning'
                              : notif.type === 'success'
                                ? 'bg-success/15 text-success'
                                : 'bg-info/15 text-info'
                        )}
                      >
                        {notif.type === 'alert' || notif.type === 'warning' ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <Info className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={cn(
                              'text-sm text-foreground',
                              !notif.read ? 'font-semibold' : 'font-medium'
                            )}
                          >
                            {notif.title}
                          </span>
                          <span className="text-muted-foreground">
                            · {notif.timeLabel}
                          </span>
                          {!notif.read && (
                            <span className="font-medium text-primary">
                              · Non lue
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {notif.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                      <Link
                        href={notif.href}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        Ouvrir
                        <ArrowUpRight className="size-3" />
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={
                          notif.read
                            ? 'Marquer comme non lue'
                            : 'Marquer comme lue'
                        }
                        onClick={() => toggleNotificationRead(notif.id)}
                      >
                        <MailOpen className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Supprimer la notification"
                        onClick={() =>
                          handleDeleteWithUndo(notif.id, notif.title)
                        }
                      >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* Preferences Card */}
          <Card className="h-fit border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Préférences de réception
              </CardTitle>
              <CardDescription className="text-xs">
                Réglages locaux de démonstration pour votre profil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  {
                    key: 'inApp',
                    label: 'Notifications In-App',
                    desc: 'Compteur et tiroir dans l’en-tête',
                  },
                  {
                    key: 'duesReminder',
                    label: 'Échéances proches (J-3)',
                    desc: 'Alerte avant date limite de paiement',
                  },
                  {
                    key: 'repeatedAbsences',
                    label: 'Absences répétées',
                    desc: 'Seuil dès 2 absences consécutives',
                  },
                  {
                    key: 'quietHours',
                    label: 'Horaires calmes (21h–08h)',
                    desc: 'Reporter les alertes non critiques',
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={`pref-${item.key}`}
                      className="text-xs font-medium"
                    >
                      {item.label}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                  <Switch
                    id={`pref-${item.key}`}
                    checked={prefs[item.key]}
                    onCheckedChange={(val) => {
                      setPrefs((prev) => ({ ...prev, [item.key]: Boolean(val) }));
                      toast.success('Préférence mise à jour (démo)');
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleGate>
  );
}
