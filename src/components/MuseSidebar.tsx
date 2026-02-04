import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/lib/chat';
import { cn } from '@/lib/utils';
import type { Message } from '../../worker/types';
interface MuseSidebarProps {
  sessionId: string;
  className?: string;
}
const QUICK_PROMPTS = [
  "Suggest SEO tags",
  "Improve the tone",
  "Summarize this draft",
  "Check for flow"
];
export function MuseSidebar({ sessionId, className }: MuseSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    await chatService.sendMessage(text, undefined, (chunk) => {
      // Local streaming state handling could be added here if needed
    });
    await loadMessages();
    setLoading(false);
  };
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <aside className={cn("w-80 border-l-2 border-black dark:border-white bg-accent/5 flex flex-col h-full", className)}>
      <div className="p-4 border-b-2 border-black dark:border-white flex items-center justify-between bg-white dark:bg-black">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-hand text-xl">The Muse</h3>
        </div>
        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
      </div>
      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="bg-white dark:bg-black p-4 rounded-xl sketch-border sketch-shadow-sm text-sm italic">
              "Every great story begins with a single drop of ink. How can I help you refine this sketch?"
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "p-3 rounded-xl sketch-border text-sm max-w-[90%]",
                m.role === 'user' 
                  ? "bg-primary text-primary-foreground ml-auto" 
                  : "bg-white dark:bg-black mr-auto sketch-shadow-sm"
              )}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs italic">
              <Loader2 className="w-3 h-3 animate-spin" />
              The Muse is thinking...
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 bg-muted/20 border-t-2 border-black dark:border-white space-y-4">
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="text-[10px] px-2 py-1 bg-accent/20 hover:bg-accent/40 rounded-full border border-black/10 dark:border-white/20 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask the Muse..."
            className="pr-10 sketch-border bg-white dark:bg-black focus-visible:ring-accent"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSend(input)}
            disabled={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-accent"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}