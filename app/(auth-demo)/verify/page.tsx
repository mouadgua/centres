'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
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

export default function VerifyDemoPage() {
  const router = useRouter();
  const [code, setCode] = useState('482910');
  const [expiredSim, setExpiredSim] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (expiredSim) {
      toast.error('Invitation ou code expiré (simulation)', {
        description:
          'Demandez un nouveau lien d’invitation auprès du Super Admin.',
      });
      return;
    }
    if (code.trim().length < 6) {
      toast.error('Code à 6 chiffres requis (saisissez ex. 482910)');
      return;
    }
    toast.success('Vérification simulée réussie', {
      description: 'Redirection vers l’assistant de mise en service du centre.',
    });
    router.push('/onboarding');
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Vérification code / invitation (démo)
          </CardTitle>
          <CardDescription>
            Code fictif pré-rempli :{' '}
            <code className="font-mono text-foreground">482910</code>. Aucun SMS
            ni email réel n&apos;est envoyé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {expiredSim && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-muted-foreground"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  Lien d&apos;invitation expiré (simulation)
                </p>
                <p>
                  Ce jeton de démonstration a dépassé sa validité de 48 heures.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <FormFieldWrapper
              id="otp-code"
              label="Code de vérification à 6 chiffres"
              required
            >
              <Input
                id="otp-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono tracking-widest tabular-nums"
              />
            </FormFieldWrapper>

            <Button type="submit" className="w-full gap-2">
              <KeyRound className="size-4" />
              Valider &amp; lancer l&apos;onboarding
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
            <button
              type="button"
              onClick={() => setExpiredSim((v) => !v)}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              {expiredSim
                ? 'Simuler un code valide'
                : 'Simuler une invitation expirée'}
            </button>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <CheckCircle2 className="size-3.5" />
              Retour connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
