'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
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

const forgotSchema = z.object({
  email: z.string().email('Veuillez saisir un email valide'),
});

export default function ForgotPasswordDemoPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: 'direction@centre.demo' },
  });

  const onSubmit = (values: z.infer<typeof forgotSchema>) => {
    setSentTo(values.email);
    toast.info('Simulation effectuée (aucun email réel envoyé)', {
      description: `En production, un lien temporaire serait envoyé à ${values.email}.`,
    });
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Réinitialisation simulée
          </CardTitle>
          <CardDescription>
            Testez le parcours de récupération de mot de passe sans serveur
            d&apos;envoi d&apos;email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sentTo ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2 className="size-4 text-success" />
                Envoi simulé pour {sentTo}
              </p>
              <p className="text-xs text-muted-foreground">
                Aucun message n&apos;a réellement quitté votre navigateur. Vous
                pouvez tester l&apos;étape de vérification du code ci-dessous.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/verify"
                  className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
                >
                  Simuler la vérification OTP
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSentTo(null)}
                >
                  Recommencer
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormFieldWrapper
                id="forgot-email"
                label="Email du compte"
                required
                error={form.formState.errors.email?.message}
              >
                <Input
                  id="forgot-email"
                  type="email"
                  {...form.register('email')}
                />
              </FormFieldWrapper>
              <Button type="submit" className="w-full gap-2">
                <Mail className="size-4" />
                Simuler l&apos;envoi du lien
              </Button>
            </form>
          )}

          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour à la connexion démo
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
