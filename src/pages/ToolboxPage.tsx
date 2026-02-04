import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { IllustrativeCard, IllustrativeHeader, IllustrativeContent, IllustrativeFooter, IllustrativeSection } from '@/components/ui/illustrative-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Link as LinkIcon, Plus, Trash2, ShieldCheck, Hammer, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function ToolboxPage() {
  const [links, setLinks] = useState<{ id: string; url: string; label: string }[]>(() => {
    const saved = localStorage.getItem('inkspill_links');
    return saved ? JSON.parse(saved) : [];
  });
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const saveLinks = (newL: typeof links) => {
    setLinks(newL);
    localStorage.setItem('inkspill_links', JSON.stringify(newL));
  };
  const addLink = () => {
    if (!newLinkUrl) return;
    try {
      new URL(newLinkUrl); // Basic validation
      const item = { id: crypto.randomUUID(), url: newLinkUrl, label: newLinkLabel || newLinkUrl };
      saveLinks([...links, item]);
      setNewLinkUrl('');
      setNewLinkLabel('');
      toast.success("Resource bookmarked!");
    } catch (e) {
      toast.error("Please enter a valid URL.");
    }
  };
  const removeLink = (id: string) => {
    saveLinks(links.filter(l => l.id !== id));
  };
  return (
    <AppLayout container>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-12 animate-fade-in">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <Hammer className="w-8 h-8 text-secondary" />
              <span className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Configuration & Tools</span>
            </div>
            <h1 className="text-6xl font-hand leading-none">The Toolbox</h1>
            <p className="text-muted-foreground text-lg max-w-2xl italic">"Keep your tools sharp and your references closer. Your creative workspace, perfectly tuned."</p>
          </header>
          <IllustrativeSection className="border-t-2 border-black/5 dark:border-white/5 pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Secret Vault */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/10 rounded-2xl sketch-border">
                    <ShieldCheck className="w-8 h-8 text-secondary" />
                  </div>
                  <h2 className="text-4xl font-hand">Secret Vault</h2>
                </div>
                <IllustrativeCard className="border-2">
                  <IllustrativeHeader>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">API Keys & Access</span>
                  </IllustrativeHeader>
                  <IllustrativeContent className="space-y-6 py-8">
                    <div className="space-y-2">
                      <Label htmlFor="openrouter" className="font-bold">OpenRouter API Key</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="openrouter" 
                          type="password" 
                          placeholder="sk-or-..." 
                          className="pl-10 sketch-border bg-muted/20 font-mono" 
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Used for switching between Gemini, Claude, or GPT models.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serpapi" className="font-bold">SerpAPI Key</Label>
                      <Input 
                        id="serpapi" 
                        type="password" 
                        placeholder="api_key_..." 
                        className="sketch-border bg-muted/20 font-mono" 
                      />
                      <p className="text-[10px] text-muted-foreground">Enables real-time web search for The Muse.</p>
                    </div>
                  </IllustrativeContent>
                  <IllustrativeFooter className="p-6">
                    <Button className="sketch-button bg-black text-white dark:bg-white dark:text-black w-full h-12 text-lg font-hand" onClick={() => toast.success("Secrets locked away!")}>
                      Secure and Lock Keys
                    </Button>
                  </IllustrativeFooter>
                </IllustrativeCard>
              </div>
              {/* Link Locker */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-2xl sketch-border">
                    <Bookmark className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="text-4xl font-hand">Link Locker</h2>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label className="font-bold">Resource Label</Label>
                        <Input
                          placeholder="Research Hub, Inspiration, etc."
                          value={newLinkLabel}
                          onChange={e => setNewLinkLabel(e.target.value)}
                          className="sketch-border h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Resource URL</Label>
                        <Input
                          placeholder="https://..."
                          value={newLinkUrl}
                          onChange={e => setNewLinkUrl(e.target.value)}
                          className="sketch-border h-12"
                        />
                      </div>
                    </div>
                    <Button className="h-12 w-12 sketch-button bg-accent text-accent-foreground" onClick={addLink}>
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                  <TooltipProvider>
                    <div className="grid grid-cols-1 gap-4">
                      {links.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-black/10 rounded-2xl font-hand text-muted-foreground bg-muted/5">
                          "Empty as a new page... add your first reference."
                        </div>
                      )}
                      {links.map(link => (
                        <div key={link.id} className="flex items-center justify-between p-4 bg-white dark:bg-black sketch-border sketch-shadow-sm group transition-transform hover:-translate-y-0.5">
                          <div className="overflow-hidden pr-4 flex-1">
                            <span className="block font-bold truncate text-lg font-hand">{link.label}</span>
                            <span className="text-[10px] text-muted-foreground truncate block font-mono opacity-60">{link.url}</span>
                          </div>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => window.open(link.url, '_blank')}
                                  className="hover:text-accent"
                                >
                                  <LinkIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open link</TooltipContent>
                            </Tooltip>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeLink(link.id)} 
                              className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </IllustrativeSection>
        </div>
      </div>
    </AppLayout>
  );
}