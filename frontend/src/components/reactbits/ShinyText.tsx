'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number;
  baseColor?: string;
  shineColor?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({ 
  text, 
  className = '',
  speed = 3,
  baseColor = 'rgba(156, 163, 175, 1)', // text-gray-400
  shineColor = 'rgba(59, 130, 246, 0.8)' // blue-500
}) => {
  return (
    <motion.span
      className={`relative inline-block overflow-hidden font-medium ${className}`}
      initial={{ backgroundPosition: '200% center' }}
      animate={{ backgroundPosition: '-200% center' }}
      transition={{ repeat: Infinity, duration: speed, ease: 'linear' }}
      style={{
        backgroundImage: `linear-gradient(120deg, ${baseColor} 20%, ${shineColor} 50%, ${baseColor} 80%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent'
      }}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
