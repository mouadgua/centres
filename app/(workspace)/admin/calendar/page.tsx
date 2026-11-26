'use client';

import React from 'react';
import { ModuleGate } from '@/components/feedback/module-gate';
import { CalendarBoard } from '@/features/calendar/calendar-board';

export default function AdminCalendarPage() {
  return (
    <ModuleGate
      moduleKey="calendar.internal"
      allowedRoles={['director', 'secretary']}
    >
      <CalendarBoard />
    </ModuleGate>
  );
}
