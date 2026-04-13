import React from 'react';

interface AzmethLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'full' | 'icon';
  className?: string;
}

export const AzmethLogo: React.FC<AzmethLogoProps> = ({ size = 'md', variant = 'full', className = '' }) => {
  const iconSizes = { sm: 20, icon: 24, md: 28, lg: 36 };
  const textSizes = { sm: 'text-sm', icon: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const px = iconSizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Plain img — avoids next/image fill + tiny-parent issues */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/azmeth-logo.png"
        alt="Azmeth AI"
        width={px}
        height={px}
        style={{ width: px, height: px, objectFit: 'contain', display: 'block', flexShrink: 0 }}
      />

      {variant === 'full' && (
        <span
          className={`${textSizes[size]} font-semibold tracking-tight text-gray-900`}
          style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}
        >
          Azmeth
        </span>
      )}
    </div>
  );
};
