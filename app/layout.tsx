import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';

const headingSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading-sans',
  display: 'swap',
});

const bodySans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body-sans',
  display: 'swap',
});

const dataMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-data-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MarkazFlow — Gestion de centres de soutien scolaire',
  description:
    'Plateforme SaaS multi-tenant white-label de gestion pour centres de soutien scolaire (prototype frontend Mode Démo).',
  openGraph: {
    title: 'MarkazFlow — Gestion de centres de soutien scolaire',
    description:
      'Plateforme SaaS multi-tenant white-label de gestion pour centres de soutien scolaire (prototype frontend Mode Démo).',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarkazFlow — Gestion de centres de soutien scolaire',
    description:
      'Plateforme SaaS multi-tenant white-label de gestion pour centres de soutien scolaire (prototype frontend Mode Démo).',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${headingSans.variable} ${bodySans.variable} ${dataMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
