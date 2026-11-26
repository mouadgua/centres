'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  MarketingFooter,
  MarketingHeader,
} from '@/components/marketing/marketing-shell';
import { GlobalBanner } from '@/components/feedback/states';
import {
  FormFieldWrapper,
  PhoneInputMA,
} from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis.'),
  email: z.string().email('Adresse email invalide.'),
  phone: z.string().min(8, 'Numéro marocain requis.'),
  centerName: z.string().min(2, 'Nom du centre requis.'),
  message: z.string().min(10, 'Précisez votre besoin (10 caractères min.).'),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      centerName: '',
      message: '',
    },
  });

  const onSubmit = (values: ContactValues) => {
    setSubmitted(true);
    toast.success('Demande prévisualisée (Mode Démo)', {
      description: `Aucun email réel envoyé pour ${values.centerName}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6">
        <GlobalBanner
          tone="info"
          title="Formulaire en Mode Démo"
          description="Ce formulaire valide la saisie côté navigateur mais n'envoie aucun email ni ticket vers un serveur."
        />

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Contacter l&apos;équipe</CardTitle>
            <CardDescription className="text-xs">
              Demande de démonstration personnalisée ou question sur le déploiement
              d&apos;une instance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4 py-4">
                <p className="text-sm font-medium text-foreground">
                  Votre message de démonstration a bien été simulé.
                </p>
                <p className="text-xs text-muted-foreground">
                  En production, une API dédiée enregistrerait la demande et
                  notifierait l&apos;équipe plateforme.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset();
                    setSubmitted(false);
                  }}
                >
                  Saisir un autre message
                </Button>
              </div>
            ) : (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <FormFieldWrapper
                  id="c-name"
                  label="Nom complet"
                  required
                  error={form.formState.errors.name?.message}
                >
                  <Input id="c-name" {...form.register('name')} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="c-email"
                  label="Email professionnel"
                  required
                  error={form.formState.errors.email?.message}
                >
                  <Input id="c-email" type="email" {...form.register('email')} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="c-phone"
                  label="Téléphone"
                  required
                  error={form.formState.errors.phone?.message}
                >
                  <PhoneInputMA id="c-phone" {...form.register('phone')} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="c-center"
                  label="Nom du centre"
                  required
                  error={form.formState.errors.centerName?.message}
                >
                  <Input id="c-center" {...form.register('centerName')} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="c-msg"
                  label="Votre message"
                  required
                  error={form.formState.errors.message?.message}
                  className="sm:col-span-2"
                >
                  <Textarea id="c-msg" rows={4} {...form.register('message')} />
                </FormFieldWrapper>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" size="sm">
                    <Send className="size-3.5" />
                    Simuler l&apos;envoi
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <MarketingFooter />
    </div>
  );
}
