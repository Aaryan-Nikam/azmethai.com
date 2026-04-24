import React from 'react';

interface AzmethLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'full' | 'icon';
  className?: string;
}

export const AzmethLogo: React.FC<AzmethLogoProps> = ({ size = 'md', variant = 'full', className = '' }) => {
  const iconSizes = { sm: 24, icon: 28, md: 34, lg: 42 };
  const textSizes = { sm: 'text-sm', icon: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const px = iconSizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/azmeth-mark-3d.png"
        alt="Azmeth AI"
        width={px}
        height={px}
        style={{
          width: px,
          height: px,
          display: 'block',
          flexShrink: 0,
        }}
      />

      {variant === 'full' && (
        <span
          className={`${textSizes[size]} font-semibold tracking-[0.02em] text-gray-900`}
          style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}
        >
          Azmeth
        </span>
      )}
    </div>
  );
};
