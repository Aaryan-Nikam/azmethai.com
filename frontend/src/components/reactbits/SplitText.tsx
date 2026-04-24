'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export const SplitText: React.FC<SplitTextProps> = ({ 
  text, 
  className = '', 
  delay = 0.05,
  duration = 0.3 
}) => {
  const words = text.split(" ");

  return (
    <div className={`flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={`${i}-${word}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * delay, duration }}
          className="mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

export default SplitText;
