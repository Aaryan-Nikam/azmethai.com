// DESIGN TOKENS — single source of truth
export const T = {
  // Surface hierarchy
  bg:  '#0d0f14',
  s1:  '#111318',
  s2:  '#161a22',
  s3:  '#0a0c10',

  // Borders
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',

  // Text
  text: '#e2e8f0',
  sub:  '#94a3b8',
  dim:  '#4b5563',

  // Accents
  blue:   '#60a5fa',
  green:  '#4ade80',
  amber:  '#fbbf24',
  purple: '#a78bfa',
  red:    '#f87171',
  cyan:   '#22d3ee',
} as const;

export const AGENTS = {
  signal_hunter: { name: 'Signal Hunter',  col: T.blue,   icon: '◈',  role: 'Lead Discovery'        },
  copy_writer:   { name: 'Copy Writer',    col: T.purple, icon: '✦',  role: 'Message Crafting'      },
  sender_agent:  { name: 'Sender Agent',   col: T.green,  icon: '↑',  role: 'Outreach Delivery'     },
  reply_handler: { name: 'Reply Handler',  col: T.amber,  icon: '💬', role: 'Inbox Management'      },
  openclaw:      { name: 'Openclaw',       col: T.cyan,   icon: '⚡', role: 'Reasoning & Orchestration' },
  nemoclaw:      { name: 'Nemoclaw',      col: '#f472b6', icon: '🐙', role: 'Memory & Context Weaving'  },
} as const;
