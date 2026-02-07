import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send, Loader2, Search, Wand2, PenLine, BarChart3 } from 'lucide-react';
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
  { label: 'SEO Score', icon: Search, prompt: 'Analyze this draft and give me an SEO score out of 10 with 3 key keywords.' },
  { label: 'Tone Check', icon: Wand2, prompt: "What is the current tone of this sketch? suggest a more 'whimsical' approach." },
  { label: 'Expand', icon: PenLine, prompt: 'Based on the current content, suggest a next paragraph.' },
  { label: 'Stats', icon: BarChart3, prompt: 'Give me reading time and word count for this sketch.' },
] as const;
export function MuseSidebar({ sessionId, className }: MuseSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptLoadingLabel, setPromptLoadingLabel] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // A tiny delay helps when layout/ScrollArea recalculates height after animations
    window.setTimeout(() => {
      try {
        bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
      } catch (e) {
        console.warn('Scroll to bottom failed:', e);
      }
    }, 20);
  }, []);
  useEffect(() => {
    chatService.switchSession(sessionId);
    void loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
  const loadMessages = async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        setMessages(res.data.messages);
        scrollToBottom('auto');
      }
    } catch (e) {
      console.error('Failed to load Muse messages:', e);
    }
  };
  const handleSend = async (text: string, sourcePromptLabel?: string) => {
    if (!text.trim() || loading) return;
    const trimmed = text.trim();
    setInput('');
    setLoading(true);
    if (sourcePromptLabel) setPromptLoadingLabel(sourcePromptLabel);
    // Immediate visual feedback: add the user message instantly.
    const tempUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    scrollToBottom();
    try {
      await chatService.sendMessage(trimmed, undefined);
      await loadMessages();
      scrollToBottom();
    } catch (e) {
      console.error('Muse send failed:', e);
    } finally {
      setLoading(false);
      setPromptLoadingLabel(null);
      scrollToBottom();
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);
  return (
    <aside className={cn('w-80 border-l-2 border-black dark:border-white bg-accent/5 flex flex-col h-full shrink-0', className)}>
      <div className="p-4 border-b-2 border-black dark:border-white flex items-center justify-between bg-white dark:bg-black">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" aria-hidden="true" />
          <h3 className="font-hand text-xl">The Muse</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Active</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div
          className="space-y-4 pb-4"
          aria-live="polite"
          aria-relevant="additions text"
          aria-atomic="false"
          aria-label="Muse conversation"
        >
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
                  'p-3 rounded-xl sketch-border text-sm max-w-[95%] break-words',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto sketch-shadow-sm'
                    : 'bg-white dark:bg-black mr-auto sketch-shadow-sm border-accent/20'
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
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                The Muse is dipping her pen...
              </motion.div>
            )}
          </AnimatePresence>
          {/* Dedicated SR-only live region to ensure "typing" state is announced reliably */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {loading ? 'The Muse is typing.' : ''}
          </div>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="p-4 bg-muted/20 border-t-2 border-black dark:border-white space-y-4">
        <div className="grid grid-cols-2 gap-2" aria-label="Quick prompts">
          {ANALYTICS_PROMPTS.map((item) => {
            const isStickerLoading = Boolean(promptLoadingLabel && promptLoadingLabel === item.label);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSend(item.prompt, item.label)}
                disabled={loading}
                aria-busy={isStickerLoading}
                aria-pressed={isStickerLoading}
                aria-label={`Send prompt: ${item.label}`}
                className={cn(
                  'flex items-center gap-2 text-[10px] px-2 py-1.5 bg-white dark:bg-black hover:bg-accent/10 rounded-lg border-2 border-black dark:border-white sketch-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {isStickerLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                ) : (
                  <item.icon className="w-3 h-3" aria-hidden="true" />
                )}
                <span className="font-bold">{isStickerLoading ? 'Pen dipping…' : item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSend(input);
            }}
            placeholder="Whisper to the Muse..."
            className="pr-10 sketch-border bg-white dark:bg-black focus-visible:ring-accent font-sans"
            aria-label="Message The Muse"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSend(input)}
            disabled={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Send message"
            title="Send message"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}