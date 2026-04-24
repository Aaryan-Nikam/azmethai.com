'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { FolderTree } from 'lucide-react';

export default function LibraryStub() {
  return (
    <div className="pb-12 max-w-7xl mx-auto">
      <PageHeader 
        title="Artifact Library" 
        description="Catalog of standalone tools and generic workflows built by the team or provided by the catalog." 
      />

      <Card className="h-64 border-dashed border-2 flex flex-col items-center justify-center bg-slate-50">
        <FolderTree size={32} className="text-slate-300 mb-4" />
        <span className="text-sm font-medium text-slate-500">Library UI Not Loaded</span>
      </Card>
    </div>
  );
}
