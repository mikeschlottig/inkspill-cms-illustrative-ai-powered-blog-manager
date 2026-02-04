import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Settings as SettingsIcon, Droplets, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MuseSidebar } from '@/components/MuseSidebar';
import { getPostContent, updatePostContent, updatePostMetadata, createPost } from '@/lib/cms-api';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';
type StatusValue = 'draft' | 'published';
function formatLastSaved(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // Refs to avoid stale closure issues in debounced function
  const currentTitleRef = useRef(title);
  const currentContentRef = useRef(content);
  useEffect(() => {
    currentTitleRef.current = title;
    currentContentRef.current = content;
  }, [title, content]);
  // Handle "/editor/new" routing by creating a new post and replacing the route.
  useEffect(() => {
    let cancelled = false;
    async function ensureRealId() {
      if (!id) return;
      if (id !== 'new') return;
      setLoading(true);
      try {
        const created = await createPost();
        const nextId =
          (created as unknown as { id?: string; sessionId?: string } | null)?.id ??
          (created as unknown as { id?: string; sessionId?: string } | null)?.sessionId;
        if (!nextId) {
          toast.error('Failed to create a new sketch. Please try again.');
          navigate('/', { replace: true });
          return;
        }
        if (!cancelled) {
          navigate(`/editor/${nextId}`, { replace: true });
        }
      } catch (e) {
        console.error('Failed to create new sketch:', e);
        toast.error('Failed to create a new sketch. Please try again.');
        navigate('/', { replace: true });
      }
    }
    void ensureRealId();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);
  const loadData = useCallback(async () => {
    if (!id) {
      toast.error('Missing sketch ID.');
      navigate('/', { replace: true });
      return;
    }
    if (id === 'new') return; // handled by effect above
    setLoading(true);
    try {
      const data = await getPostContent(id);
      if (!data) {
        toast.error('That sketch could not be found. It may have been deleted.');
        navigate('/', { replace: true });
        return;
      }
      setTitle(data.title || '');
      setContent(data.content || '');
      setLastSaved(null);
    } catch (err) {
      console.error('Failed to load sketch content:', err);
      toast.error('Failed to load sketch content');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);
  useEffect(() => {
    void loadData();
  }, [loadData]);
  const saveAction = useCallback(
    async (t: string, c: string) => {
      if (!id || id === 'new') return;
      setSaving(true);
      let succeeded = false;
      try {
        const ok1 = await updatePostContent(id, { title: t, content: c });
        const ok2 = await updatePostMetadata(id, { title: t });
        succeeded = Boolean(ok1 && ok2);
      } catch (err) {
        console.error('Save error:', err);
      } finally {
        setSaving(false);
        if (succeeded) setLastSaved(new Date());
      }
    },
    [id]
  );
  // Keep a stable debounced function, but always call the latest saveAction.
  const saveActionRef = useRef(saveAction);
  useEffect(() => {
    saveActionRef.current = saveAction;
  }, [saveAction]);
  const debouncedSave = useRef(
    debounce((t: string, c: string) => {
      void saveActionRef.current(t, c);
    }, 1000)
  ).current;
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
      <div className="h-screen flex items-center justify-center bg-background" aria-busy="true" aria-live="polite">
        <Loader2 className="w-10 h-10 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading sketch…</span>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="p-4 border-b-2 border-black dark:border-white flex items-center justify-between bg-white dark:bg-black z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="sketch-button"
              aria-label="Back to Sketchbook"
              title="Back to Sketchbook"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-hand">The Canvas</h2>
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait" initial={false}>
                  {saving ? (
                    <motion.div
                      key="saving"
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      className="flex items-center gap-2"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.15, 1], opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-flex"
                        aria-hidden="true"
                      >
                        <Droplets className="w-4 h-4 text-accent" />
                      </motion.span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Ink drying… saving</span>
                    </motion.div>
                  ) : lastSaved ? (
                    <motion.div
                      key={lastSaved.getTime()}
                      initial={{ opacity: 0, y: -2, filter: 'blur(1px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <motion.span
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [0.95, 1.08, 1] }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="inline-flex"
                        aria-hidden="true"
                      >
                        <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.25)]" />
                      </motion.span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700/90 dark:text-emerald-300/90">
                        Ink stamped at {formatLastSaved(lastSaved)}
                      </span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="sketch-button bg-white dark:bg-black"
                  aria-label="Open sketch metadata"
                  title="Open metadata"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                  Meta
                </Button>
              </SheetTrigger>
              <SheetContent className="sketch-border" aria-describedby="sketch-meta-description">
                <SheetHeader>
                  <SheetTitle className="font-hand text-2xl">Sketch Metadata</SheetTitle>
                  <SheetDescription id="sketch-meta-description">
                    Adjust publishing status and tags. Changes are saved to your Sketchbook index.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 py-8">
                  <div className="space-y-2">
                    <Label htmlFor="meta-status">Status</Label>
                    <Select
                      onValueChange={(val) => {
                        if (!id) return;
                        void updatePostMetadata(id, { status: val as StatusValue }).catch((e) => {
                          console.error('Failed to update status:', e);
                          toast.error('Could not update status. Please try again.');
                        });
                      }}
                    >
                      <SelectTrigger id="meta-status" className="sketch-border" aria-label="Select publishing status">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta-tags">Tags (comma separated)</Label>
                    <Input
                      id="meta-tags"
                      placeholder="poetry, tech, thoughts"
                      className="sketch-border"
                      aria-label="Tags, comma separated"
                      onBlur={(e) => {
                        if (!id) return;
                        void updatePostMetadata(id, {
                          tags: e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean),
                        }).catch((err) => {
                          console.error('Failed to update tags:', err);
                          toast.error('Could not update tags. Please try again.');
                        });
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Tip: keep tags short—like labels on little ink bottles.
                    </p>
                  </div>
                  <Button
                    className="w-full sketch-button bg-accent text-accent-foreground font-bold"
                    onClick={() => toast.success('Metadata updated')}
                    aria-label="Confirm metadata changes"
                  >
                    Confirm Changes
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              className="sketch-button bg-secondary text-white font-bold"
              onClick={() => toast.info('Publishing interface coming soon.')}
              aria-label="Publish sketch"
              title="Publish"
            >
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
              aria-label="Sketch title"
            />
            <div className="w-full h-[1px] bg-black/5 dark:bg-white/5" />
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Once upon a time in a digital sketchbook..."
              className="flex-1 min-h-[70vh] text-xl leading-relaxed border-none focus-visible:ring-0 bg-transparent px-0 resize-none placeholder:opacity-20 dark:text-white/80"
              aria-label="Sketch content"
            />
          </div>
        </main>
      </div>
      {id && id !== 'new' ? <MuseSidebar sessionId={id} /> : null}
    </div>
  );
}