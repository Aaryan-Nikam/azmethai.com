import React from 'react';
import { Card } from './card';

interface StatTileProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, subValue, trend }) => {
  return (
    <Card className="flex flex-col">
      <span className="text-sm font-medium text-slate-500 mb-2">{label}</span>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        {subValue && (
          <span className={`text-xs font-semibold mb-1 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-slate-400'
          }`}>
            {subValue}
          </span>
        )}
      </div>
    </Card>
  );
};
