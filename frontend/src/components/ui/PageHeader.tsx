import React from 'react';
import { Button } from './button';

interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
  };
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, primaryAction, children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between items-start gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{title}</h1>
        {description && <p className="text-sm text-slate-500 max-w-2xl">{description}</p>}
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {children}
        {primaryAction && (
          <Button onClick={primaryAction.onClick} variant="primary">
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};
