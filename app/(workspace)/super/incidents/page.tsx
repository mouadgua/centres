'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  INITIAL_INCIDENTS,
  type SaasIncident,
} from '@/lib/mock-api/super-admin-data';

export default function SuperIncidentsPage() {
  const [incidents, setIncidents] = useState<SaasIncident[]>(INITIAL_INCIDENTS);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim().length < 4) return;
    setIncidents((prev) => [
      {
        id: `inc-${Date.now()}`,
        title: newTitle.trim(),
        scope: 'Plateforme démo',
        severity: 'mineur',
        status: 'en_cours',
        startedAt: "Aujourd'hui",
        summary: 'Incident enregistré manuellement pour simulation UX.',
      },
      ...prev,
    ]);
    setNewTitle('');
    toast.warning('Incident de démonstration publié');
  };

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Incidents &amp; disponibilité plateforme
          </h1>
          <p className="text-sm text-muted-foreground">
            Journal des limitations connues du prototype et suivi d&apos;incidents
            simulés.
          </p>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Déclarer un incident de démonstration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex. Ralentissement simulé passerelle WhatsApp"
                className="flex-1 min-w-60"
              />
              <Button type="submit" size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                Publier (démo)
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <Card key={inc.id} className="border-border shadow-none">
              <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  {inc.status === 'resolu' ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{inc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {inc.scope} · Sévérité {inc.severity} · {inc.startedAt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inc.summary}
                    </p>
                  </div>
                </div>

                {inc.status !== 'resolu' && (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setIncidents((prev) =>
                        prev.map((row) =>
                          row.id === inc.id ? { ...row, status: 'resolu' } : row
                        )
                      );
                      toast.success('Incident marqué résolu');
                    }}
                  >
                    Marquer résolu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ModuleGate>
  );
}
