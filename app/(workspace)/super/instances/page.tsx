'use client';

import React from 'react';
import { ModuleGate } from '@/components/feedback/module-gate';
import { InstanceConfigurator } from '@/features/super-admin/instance-configurator';

export default function SuperInstancesPage() {
  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <InstanceConfigurator />
    </ModuleGate>
  );
}
