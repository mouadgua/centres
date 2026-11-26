'use client';

import React, { useState } from 'react';
import { CreditCard, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMAD } from '@/lib/format/morocco';
import {
  INITIAL_SAAS_INVOICES,
  type SaasInvoiceRow,
} from '@/lib/mock-api/super-admin-data';

export default function SuperBillingPage() {
  const [invoices, setInvoices] = useState<SaasInvoiceRow[]>(
    INITIAL_SAAS_INVOICES
  );

  const totalCollected = invoices
    .filter((i) => i.status === 'payee')
    .reduce((s, i) => s + i.amountMad, 0);

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Facturation SaaS (Mode Démo)
            </h1>
            <p className="text-sm text-muted-foreground">
              Factures d&apos;abonnement des centres en MAD (simulation sans
              passerelle de paiement ni valeur fiscale).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              toast.info('Export CSV facturation SaaS simulé (données fictives)')
            }
          >
            <Download className="size-3.5" />
            Exporter synthèse (démo)
          </Button>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4 text-primary" />
              Encaissements SaaS fictifs sur la période
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatMAD(totalCollected)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardContent className="divide-y divide-border p-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-mono text-sm font-medium">
                    {inv.reference} · {inv.centerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.period} · Émise le {inv.issuedAt}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatMAD(inv.amountMad)}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      inv.status === 'payee'
                        ? 'text-success'
                        : inv.status === 'en_attente'
                          ? 'text-warning'
                          : 'text-destructive'
                    }`}
                  >
                    {inv.status === 'payee'
                      ? 'Payée'
                      : inv.status === 'en_attente'
                        ? 'En attente'
                        : 'En retard'}
                  </span>
                  {inv.status !== 'payee' && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setInvoices((prev) =>
                          prev.map((row) =>
                            row.id === inv.id
                              ? { ...row, status: 'payee' }
                              : row
                          )
                        );
                        toast.success(`${inv.reference} marquée payée (démo)`);
                      }}
                    >
                      Marquer payée
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
