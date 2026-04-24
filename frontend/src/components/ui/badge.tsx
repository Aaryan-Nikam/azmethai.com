import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'green' | 'purple' | 'amber' | 'slate' | 'online' | 'paused' | 'building' | 'executing';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '', ...props }) => {
  const variants = {
    cyan: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    
    // Status mappings
    online: 'bg-green-50 text-green-700 border-green-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    building: 'bg-blue-50 text-blue-700 border-blue-200',
    executing: 'bg-blue-100 text-blue-700 border-blue-300 font-bold',
  };

  const isExecuting = variant === 'executing';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${variants[variant]} ${className}`}
      {...props}
    >
      {isExecuting && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
      {variant === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
      {children}
    </span>
  );
};
