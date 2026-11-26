'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import { InstanceConfigurator } from '@/features/super-admin/instance-configurator';

export default function SuperCenterConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-4">
        <Link
          href={`/super/centers/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour à la fiche centre
        </Link>
        <InstanceConfigurator fixedCenterId={id} />
      </div>
    </ModuleGate>
  );
}
