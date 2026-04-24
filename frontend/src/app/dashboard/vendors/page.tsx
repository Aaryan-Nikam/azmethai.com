'use client';

import React, { useRef, useState } from 'react';
import VendorTable from './components/VendorTable';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function VendorDashboardPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLastUpload(file.name);
    toast.success(`Certification queued: ${file.name}`);
    event.target.value = '';
  };

  return (
    <div className="p-8 space-y-6 w-full max-w-[1600px] mx-auto bg-[#0a0a0d] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vendor Compliance</h1>
          <p className="text-gray-400 mt-1">
            Real-time systemic risk monitoring and zero-trust security bounds.
            {lastUpload ? ` Last upload: ${lastUpload}` : ''}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => fileRef.current?.click()} className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors">
            Upload Certification
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-[#121217] border-[#1f2025]">
          <h3 className="text-gray-400 text-sm font-medium">Critical Breaches</h3>
          <p className="text-3xl font-semibold text-red-500 mt-2">2</p>
        </Card>
        <Card className="p-6 bg-[#121217] border-[#1f2025]">
          <h3 className="text-gray-400 text-sm font-medium">Expiring Soon (&lt;60d)</h3>
          <p className="text-3xl font-semibold text-amber-500 mt-2">5</p>
        </Card>
        <Card className="p-6 bg-[#121217] border-[#1f2025]">
          <h3 className="text-gray-400 text-sm font-medium">Compliant Vendors</h3>
          <p className="text-3xl font-semibold text-emerald-500 mt-2">148</p>
        </Card>
        <Card className="p-6 bg-[#121217] border-[#1f2025]">
          <h3 className="text-gray-400 text-sm font-medium">Total Vendors tracked</h3>
          <p className="text-3xl font-semibold text-white mt-2">155</p>
        </Card>
      </div>

      <div className="bg-[#121217] border border-[#1f2025] rounded-xl overflow-hidden mt-8">
        <VendorTable />
      </div>
    </div>
  );
}
