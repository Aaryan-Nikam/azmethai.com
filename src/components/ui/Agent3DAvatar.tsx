'use client';

import React from 'react';
import { motion } from 'framer-motion';
// Removed spline import to fix cloudflare build issues

interface Agent3DAvatarProps {
  agent?: any;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

export function Agent3DAvatar({ 
  agent, 
  size = 'medium',
  interactive = true 
}: Agent3DAvatarProps) {
  const sizeClasses = {
    small: 'h-14',
    medium: 'h-48',
    large: 'h-96'
  };
  
  const sceneUrl = agent?.avatarUrl || 'https://prod.spline.design/6Wq1Q7YGyMvq2z7N/scene.splinecode';

  return (
    <motion.div 
      className={`relative ${sizeClasses[size]} w-full rounded-lg overflow-hidden bg-black/5 mr-0`}
      whileHover={interactive ? { scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center">
         <div className="relative w-3/4 h-3/4 rounded-full border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
           <div className="absolute inset-2 rounded-full border border-purple-500/20 animate-spin-slow" />
           <div className="absolute inset-4 rounded-full border border-cyan-500/30 animate-pulse" />
           <div className="absolute inset-8 bg-gradient-to-tr from-blue-900/40 to-purple-900/40 rounded-full blur-md" />
         </div>
      </div>
      
      <div className={`absolute inset-0 pointer-events-none z-10 ${getStatusGlow(agent?.status || 'stopped')}`} />
      
      {agent?.status === 'running' && <FloatingParticles />}
    </motion.div>
  );
}

function getStatusGlow(status: string) {
  const glows: Record<string, string> = {
    running: 'shadow-[inset_0_0_40px_rgba(34,197,94,0.2)] border border-green-500/20',
    paused: 'shadow-[inset_0_0_40px_rgba(234,179,8,0.2)] border border-yellow-500/20',
    complete: 'shadow-[inset_0_0_40px_rgba(6,182,212,0.2)] border border-cyan-500/20',
    error: 'shadow-[inset_0_0_40px_rgba(239,68,68,0.2)] border border-red-500/20',
    stopped: 'shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] border border-white/5'
  };
  return glows[status] || glows.stopped;
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          initial={{ 
            x: Math.random() * 100 + '%',
            y: '110%',
            opacity: 0 
          }}
          animate={{
            y: '-20%',
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}
