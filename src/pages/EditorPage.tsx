import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MuseSidebar } from '@/components/MuseSidebar';
import { getPostContent, updatePostContent, updatePostMetadata } from '@/lib/cms-api';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';
export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Refs to avoid stale closure issues in debounced function
  const currentTitleRef = useRef(title);
  const currentContentRef = useRef(content);
  useEffect(() => {
    currentTitleRef.current = title;
    currentContentRef.current = content;
  }, [title, content]);
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getPostContent(id);
      if (data) {
        setTitle(data.title || '');
        setContent(data.content || '');
      }
    } catch (err) {
      toast.error("Failed to load sketch content");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const saveAction = useCallback(async (t: string, c: string) => {
    if (!id) return;
    setSaving(true);
    try {
      await updatePostContent(id, { title: t, content: c });
      await updatePostMetadata(id, { title: t });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [id]);
  // Using ref-wrapped debounce to prevent re-creation on every render
  const debouncedSave = useRef(debounce(saveAction, 1000)).current;
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    debouncedSave(val, currentContentRef.current);
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    debouncedSave(currentTitleRef.current, val);
  };
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="p-4 border-b-2 border-black dark:border-white flex items-center justify-between bg-white dark:bg-black z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="sketch-button">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-hand">The Canvas</h2>
              {saving && (
                <span className="text-[10px] uppercase font-bold text-muted-foreground animate-pulse ml-2">
                  Saving...
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="sketch-button bg-white dark:bg-black">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Meta
                </Button>
              </SheetTrigger>
              <SheetContent className="sketch-border">
                <SheetHeader>
                  <SheetTitle className="font-hand text-2xl">Sketch Metadata</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-8">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select onValueChange={(val) => updatePostMetadata(id!, { status: val as any })}>
                      <SelectTrigger className="sketch-border">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (Comma separated)</Label>
                    <Input 
                      placeholder="poetry, tech, thoughts" 
                      className="sketch-border"
                      onBlur={(e) => updatePostMetadata(id!, { tags: e.target.value.split(',').map(t => t.trim()) })}
                    />
                  </div>
                  <Button className="w-full sketch-button bg-accent text-accent-foreground font-bold" onClick={() => toast.success("Metadata updated")}>
                    Confirm Changes
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button className="sketch-button bg-secondary text-white font-bold" onClick={() => toast.info("Publishing interface coming soon.")}>
              Publish
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-[#fdfbf7] dark:bg-black/20">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <Input
              value={title}
              onChange={handleTitleChange}
              placeholder="Sketch Title..."
              className="text-5xl font-hand h-auto border-none focus-visible:ring-0 bg-transparent px-0 placeholder:opacity-30 dark:text-white"
            />
            <div className="w-full h-[1px] bg-black/5 dark:bg-white/5" />
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Once upon a time in a digital sketchbook..."
              className="flex-1 min-h-[70vh] text-xl leading-relaxed border-none focus-visible:ring-0 bg-transparent px-0 resize-none placeholder:opacity-20 dark:text-white/80"
            />
          </div>
        </main>
      </div>
      {id && <MuseSidebar sessionId={id} />}
    </div>
  );
}