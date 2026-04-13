'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/StatTile';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function MonitoringStub() {
  return (
    <div className="pb-12 max-w-7xl mx-auto">
      <PageHeader 
        title="Audit Log" 
        description="Global system telemetry and token consumption metrics." 
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatTile label="Global Tokens (24h)" value="24.8M" trend="up" subValue="+2% vs yesterday" />
        <StatTile label="Total Ops Cost" value="$182.40" trend="up" />
        <StatTile label="Avg Inference latency" value="480ms" trend="down" subValue="-12ms" />
        <StatTile label="Critical Failure Rate" value="0.04%" />
      </div>

      <Card className="h-80 border-dashed border-2 flex flex-col items-center justify-center bg-slate-50">
        <Activity size={32} className="text-slate-300 mb-4" />
        <span className="text-sm font-medium text-slate-500">Telemetry Charts Loading...</span>
      </Card>
    </div>
  );
}
