'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'blue' | 'green' | 'purple' | 'none'; // Kept for interface compatibility but ignored visually
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = 'none', hoverable, ...props }) => {
  const hoverEffect = hoverable ? 'hover:shadow-md hover:border-slate-300 transition-all' : '';

  return (
    <div 
      className={`bg-white border border-slate-200 shadow-sm rounded-xl p-6 ${hoverEffect} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
