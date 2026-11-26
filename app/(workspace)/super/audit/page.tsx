'use client';

import React, { useMemo, useState } from 'react';
import { FileSearch, Search } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { INITIAL_AUDIT_LOGS } from '@/lib/mock-api/super-admin-data';

export default function SuperAuditPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INITIAL_AUDIT_LOGS;
    return INITIAL_AUDIT_LOGS.filter(
      (a) =>
        a.actor.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Audit &amp; sécurité plateforme
          </h1>
          <p className="text-sm text-muted-foreground">
            Journal des opérations administratives sur les instances centres
            (traces fictives Mode Démo).
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer par acteur, centre ou action..."
            className="pl-8"
          />
        </div>

        <Card className="border-border shadow-none">
          <CardContent className="divide-y divide-border p-4">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-2.5">
                  <FileSearch className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      {log.action} · {log.target}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.detail}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground sm:text-right">
                  <p>{log.actor}</p>
                  <p className="font-mono tabular-nums">{log.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
