import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Info, Search, Wand2, PenLine, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/lib/chat';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../../worker/types';
interface MuseSidebarProps {
  sessionId: string;
  className?: string;
}
const ANALYTICS_PROMPTS = [
  { label: "SEO Score", icon: Search, prompt: "Analyze this draft and give me an SEO score out of 10 with 3 key keywords." },
  { label: "Tone Check", icon: Wand2, prompt: "What is the current tone of this sketch? suggest a more 'whimsical' approach." },
  { label: "Expand", icon: PenLine, prompt: "Based on the current content, suggest a next paragraph." },
  { label: "Stats", icon: BarChart3, prompt: "Give me reading time and word count for this sketch." }
];
export function MuseSidebar({ sessionId, className }: MuseSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatService.switchSession(sessionId);
    loadMessages();
  }, [sessionId]);
  const loadMessages = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  };
  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    setLoading(true);
    const tempUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempUserMessage]);
    await chatService.sendMessage(text, undefined);
    await loadMessages();
    setLoading(false);
  };
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  return (
    <aside className={cn("w-80 border-l-2 border-black dark:border-white bg-accent/5 flex flex-col h-full shrink-0", className)}>
      <div className="p-4 border-b-2 border-black dark:border-white flex items-center justify-between bg-white dark:bg-black">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          <h3 className="font-hand text-xl">The Muse</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Active</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-black p-4 rounded-xl sketch-border sketch-shadow-sm text-sm italic"
              >
                "Every great story begins with a single drop of ink. I'm watching your canvas—ask me anything."
              </motion.div>
            )}
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-3 rounded-xl sketch-border text-sm max-w-[95%] break-words",
                  m.role === 'user'
                    ? "bg-primary text-primary-foreground ml-auto sketch-shadow-sm"
                    : "bg-white dark:bg-black mr-auto sketch-shadow-sm border-accent/20"
                )}
              >
                {m.content}
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground text-xs italic p-2"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                The Muse is dipping her pen...
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="p-4 bg-muted/20 border-t-2 border-black dark:border-white space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {ANALYTICS_PROMPTS.map(item => (
            <button
              key={item.label}
              onClick={() => handleSend(item.prompt)}
              className="flex items-center gap-2 text-[10px] px-2 py-1.5 bg-white dark:bg-black hover:bg-accent/10 rounded-lg border-2 border-black dark:border-white sketch-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <item.icon className="w-3 h-3" />
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Whisper to the Muse..."
            className="pr-10 sketch-border bg-white dark:bg-black focus-visible:ring-accent font-sans"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSend(input)}
            disabled={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-accent transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}