'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Send, Sparkles, User, Terminal, 
  ArrowRight, Activity, Zap
} from 'lucide-react';
import { AzmethLogo } from '@/components/ui/AzmethLogo';

// ─── TYPES ──────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ParsedBlock {
  type: 'text' | 'nav';
  content: string;
  navUrl?: string;
  navLabel?: string;
}

// ─── NAV PARSER ─────────────────────────────────────────────────────────
function parseMessage(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const regex = /\[NAV:(.*?)\|(.*?)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    blocks.push({
      type: 'nav',
      content: match[0],
      navUrl: match[1],
      navLabel: match[2],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return blocks;
}

// ─── SUGGESTIONS ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { text: "How do I build an AI employee?", icon: Zap },
  { text: "Show me my inbound leads for today.", icon: User },
  { text: "Take me to the System Logs.", icon: Terminal },
];

export default function AzmethAgentDashboard() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your Azmeth AI Operator. I can help you orchestrate workflows, manage your AI employees, or navigate the platform. What are we building today?",
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);

  const handleSubmit = async (e?: React.FormEvent, overridingInput?: string) => {
    e?.preventDefault();
    
    const submittedText = overridingInput || input;
    if (!submittedText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: submittedText.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role,
        content: m.content
      }));
      chatHistory.push({ role: 'user', content: submittedText.trim() });

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      
      const data = await res.json();
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "I encountered an error processing your request.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I lost my connection to the command center. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans relative">
      
      {/* ─── BACKGROUND FX ─── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* ─── HEADER ─── */}
      <header className="shrink-0 h-[60px] border-b border-gray-200 flex items-center justify-between px-8 z-10 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
            <AzmethLogo className="w-5 h-5 flex items-center justify-center -ml-0.5" size="icon" variant="icon" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Azmeth OS Agent</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">System Linked</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
           <span className="flex items-center gap-1.5"><Activity size={12} className="text-green-500" /> Latency: 24ms</span>
        </div>
      </header>

      {/* ─── CHAT HISTORY ─── */}
      <main className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth z-10 custom-scrollbar">
        <div className="max-w-3xl mx-auto py-10 space-y-8 flex flex-col min-h-full">
          
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            const blocks = parseMessage(msg.content);
            
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${isBot ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-1
                  ${isBot 
                    ? 'bg-gray-50 text-gray-900 border-gray-200 shadow-sm' 
                    : 'bg-white text-gray-400 border-gray-200'}`}>
                  {isBot ? <Sparkles size={14} className="text-blue-600" /> : <User size={14} />}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col gap-2 max-w-[85%] ${isBot ? 'items-start' : 'items-end'}`}>
                  <div className={`text-[14px] leading-relaxed px-5 py-4 rounded-2xl shadow-sm border
                    ${isBot 
                      ? 'bg-white border-gray-200 text-gray-700 rounded-tl-sm' 
                      : 'bg-gray-900 border-gray-900 text-white rounded-tr-sm font-medium'}`}>
                    
                    {blocks.map((b, i) => {
                      if (b.type === 'text') {
                        return <span key={i} className="whitespace-pre-wrap">{b.content}</span>;
                      }
                      if (b.type === 'nav') {
                         return (
                           <button 
                             key={i} 
                             onClick={() => router.push(b.navUrl!)}
                             className={`block w-full text-left mt-4 px-4 py-3 rounded-xl transition-all group border
                               ${isBot 
                                 ? 'bg-blue-50/50 hover:bg-blue-50 border-blue-200/50' 
                                 : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                           >
                              <div className="flex items-center justify-between">
                                <span className={`font-semibold text-sm ${isBot ? 'text-blue-700' : 'text-white'}`}>
                                  {b.navLabel}
                                </span>
                                <ArrowRight size={14} className={`${isBot ? 'text-blue-500' : 'text-white/70'} transform group-hover:translate-x-1 transition-transform`} />
                              </div>
                              <span className={`block mt-1 text-[10px] font-mono ${isBot ? 'text-blue-400' : 'text-white/50'}`}>
                                {b.navUrl}
                              </span>
                           </button>
                         );
                      }
                      return null;
                    })}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium px-1">
                     {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Loading States */}
          {isLoading && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Sparkles size={14} className="text-blue-600 animate-pulse" />
              </div>
              <div className="bg-white border border-gray-200 px-5 py-5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      {/* ─── INPUT AREA ─── */}
      <div className="shrink-0 max-w-3xl mx-auto w-full px-4 md:px-0 pb-8 z-20">
        
        {/* Empty State Suggestions */}
        {messages.length === 1 && !isLoading && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(undefined, s.text)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all shadow-sm shrink-0"
              >
                <s.icon size={13} className="text-blue-600/70" /> {s.text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={e => handleSubmit(e)} className="relative group">
           <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Azmeth to navigate or run commands..."
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-6 pr-14 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-xl transition-all"
            rows={1}
            style={{ minHeight: '60px', maxHeight: '200px' }}
           />
           
           <button 
             type="submit" 
             disabled={!input.trim() || isLoading}
             className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-gray-900 text-white disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-black active:scale-95 shadow-md"
           >
             <Send size={15} className="ml-0.5" />
           </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 font-medium mt-4">
          Azmeth Agent can make mistakes. Verify critical actions before confirming.
        </p>
      </div>

    </div>
  );
}
