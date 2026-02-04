import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { IllustrativeCard, IllustrativeHeader, IllustrativeContent, IllustrativeFooter, IllustrativeSection } from '@/components/ui/illustrative-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Link as LinkIcon, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
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
    const item = { id: crypto.randomUUID(), url: newLinkUrl, label: newLinkLabel || newLinkUrl };
    saveLinks([...links, item]);
    setNewLinkUrl('');
    setNewLinkLabel('');
    toast.success("Resource bookmarked!");
  };
  const removeLink = (id: string) => {
    saveLinks(links.filter(l => l.id !== id));
  };
  return (
    <AppLayout container>
      <div className="space-y-12 animate-fade-in">
        <header className="space-y-2">
          <h1 className="text-5xl font-hand">The Toolbox</h1>
          <p className="text-muted-foreground max-w-2xl">Configure your workspace, manage secrets, and keep your references within reach.</p>
        </header>
        <IllustrativeSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Secret Vault */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-secondary" />
                <h2 className="text-3xl font-hand">Secret Vault</h2>
              </div>
              <IllustrativeCard>
                <IllustrativeContent className="space-y-4 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="openrouter">OpenRouter API Key</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="openrouter" type="password" placeholder="sk-or-..." className="pl-10 sketch-border bg-muted/20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serpapi">SerpAPI Key (Optional)</Label>
                    <Input id="serpapi" type="password" placeholder="api_key_..." className="sketch-border bg-muted/20" />
                  </div>
                  <p className="text-xs text-muted-foreground italic">Secrets are saved in your local browser state for this demo phase.</p>
                </IllustrativeContent>
                <IllustrativeFooter>
                  <Button className="sketch-button bg-black text-white dark:bg-white dark:text-black w-full" onClick={() => toast.success("Secrets locked away!")}>
                    Save Keys
                  </Button>
                </IllustrativeFooter>
              </IllustrativeCard>
            </div>
            {/* Link Locker */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-8 h-8 text-accent" />
                <h2 className="text-3xl font-hand">Link Locker</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="Label (e.g. Research Hub)" 
                      value={newLinkLabel} 
                      onChange={e => setNewLinkLabel(e.target.value)}
                      className="sketch-border" 
                    />
                    <Input 
                      placeholder="URL (https://...)" 
                      value={newLinkUrl} 
                      onChange={e => setNewLinkUrl(e.target.value)}
                      className="sketch-border" 
                    />
                  </div>
                  <Button size="icon" className="h-full sketch-button bg-accent text-accent-foreground" onClick={addLink}>
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {links.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-black/10 rounded-xl font-hand text-muted-foreground">
                      No links locked yet.
                    </div>
                  )}
                  {links.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-white dark:bg-black sketch-border sketch-shadow-sm group">
                      <div className="overflow-hidden">
                        <span className="block font-bold truncate">{link.label}</span>
                        <span className="text-[10px] text-muted-foreground truncate block">{link.url}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeLink(link.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </IllustrativeSection>
      </div>
    </AppLayout>
  );
}