'use client';

import React, { useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  INITIAL_SUPPORT_TICKETS,
  type SaasSupportTicket,
} from '@/lib/mock-api/super-admin-data';

export default function SuperSupportPage() {
  const [tickets, setTickets] = useState<SaasSupportTicket[]>(
    INITIAL_SUPPORT_TICKETS
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const activeTicket = tickets.find((t) => t.id === activeId) ?? null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || replyText.trim().length < 2) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === activeTicket.id
          ? {
              ...t,
              status: 'en_cours',
              updatedAt: "À l'instant",
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  author: 'Mehdi Benjelloun (Support SaaS)',
                  role: 'support',
                  body: replyText.trim(),
                  time: 'Maintenant',
                },
              ],
            }
          : t
      )
    );
    setReplyText('');
    toast.success('Réponse ajoutée au ticket (Mode Démo)');
  };

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Tickets &amp; assistance centres
          </h1>
          <p className="text-sm text-muted-foreground">
            Demandes d&apos;activation de modules et questions de configuration
            (conversations simulées).
          </p>
        </div>

        <Card className="border-border shadow-none">
          <CardContent className="divide-y divide-border p-4">
            {tickets.map((tkt) => (
              <div
                key={tkt.id}
                className="flex flex-col justify-between gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <LifeBuoy className="size-4 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {tkt.code}
                    </span>
                    {tkt.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tkt.centerName} · {tkt.category} · Priorité {tkt.priority}{' '}
                    · {tkt.updatedAt}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {tkt.status.replace('_', ' ')}
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setActiveId(tkt.id)}
                  >
                    Ouvrir fil
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Sheet
          open={Boolean(activeTicket)}
          onOpenChange={(open) => {
            if (!open) setActiveId(null);
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
            {activeTicket && (
              <>
                <SheetHeader className="border-b border-border pb-3">
                  <SheetTitle className="text-base">
                    {activeTicket.code} — {activeTicket.centerName}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {activeTicket.subject}
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {activeTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-3 text-xs ${
                        m.role === 'support'
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {m.author}
                        </span>
                        <span>{m.time}</span>
                      </div>
                      <p className="mt-1.5 text-foreground">{m.body}</p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSendReply}
                  className="space-y-3 border-t border-border p-4"
                >
                  <Textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Répondre au centre (simulation Mode Démo)..."
                  />
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTickets((prev) =>
                          prev.map((t) =>
                            t.id === activeTicket.id
                              ? { ...t, status: 'resolu' }
                              : t
                          )
                        );
                        toast.success(`Ticket ${activeTicket.code} marqué résolu`);
                      }}
                    >
                      Marquer résolu
                    </Button>
                    <Button type="submit" size="sm" className="gap-1.5">
                      <Send className="size-3.5" />
                      Envoyer (démo)
                    </Button>
                  </div>
                </form>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ModuleGate>
  );
}
