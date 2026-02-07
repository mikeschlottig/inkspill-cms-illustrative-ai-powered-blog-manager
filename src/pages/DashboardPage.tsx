import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, PenLine, Sparkles, Feather, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { ViewToggle } from '@/components/ViewToggle';
import { IllustrativeCard, IllustrativeHeader, IllustrativeContent, IllustrativeFooter } from '@/components/ui/illustrative-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getPosts, createPost } from '@/lib/cms-api';
import type { SessionInfo } from '../../worker/types';
export function DashboardPage() {
  const [posts, setPosts] = useState<SessionInfo[]>([]);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts();
      setPosts(data || []);
    } catch (e) {
      console.error('Failed to load posts:', e);
      toast.error('Could not load your sketches. Please refresh.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleNewPost = async () => {
    try {
      const created = await createPost();
      const nextId =
        (created as unknown as { id?: string; sessionId?: string } | null)?.id ??
        (created as unknown as { id?: string; sessionId?: string } | null)?.sessionId;
      if (!nextId) {
        toast.error('Could not create a new sketch. Please try again.');
        return;
      }
      navigate(`/editor/${nextId}`);
    } catch (e) {
      console.error('Failed to create post:', e);
      toast.error('Could not create a new sketch. Please try again.');
    }
  };
  const openPost = (postId: unknown) => {
    if (typeof postId !== 'string' || !postId.trim()) {
      console.error('Invalid post id:', postId);
      toast.error('That sketch seems to be missing an ID. Please refresh.');
      return;
    }
    navigate(`/editor/${postId}`);
  };
  const q = search.trim().toLowerCase();
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (!q) return true;
      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const summaryMatch = (p.summary || '').toLowerCase().includes(q);
      const tagsMatch = (p.tags || []).some((t) => (t || '').toLowerCase().includes(q));
      return titleMatch || summaryMatch || tagsMatch;
    });
  }, [posts, q]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  return (
    <AppLayout container>
      <div className="space-y-8 animate-fade-in relative">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Creative Hub</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-hand leading-none">The Sketchbook</h1>
            <p className="text-muted-foreground text-lg italic">"A thousand stories begin in this very inkwell."</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <ViewToggle view={view} onChange={setView} />
            <Button
              onClick={handleNewPost}
              className="sketch-button bg-accent text-accent-foreground font-bold px-8 h-12 text-lg"
              aria-label="Create a new sketch"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              New Sketch
            </Button>
          </div>
        </header>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" aria-hidden="true" />
          <Input
            placeholder="Search through your archives..."
            className="pl-12 h-14 border-2 border-black sketch-shadow-sm bg-white text-lg font-hand transition-all hover:sketch-shadow-sm focus-visible:sketch-shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search posts"
          />
        </div>
        <AnimatePresence>
          {loading && posts.length === 0 ? (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm"
              aria-hidden="true"
            >
              <div className="sketch-border sketch-shadow bg-white dark:bg-black rounded-2xl px-6 py-4 flex items-center gap-3">
                <motion.span
                  animate={{ y: [0, -4, 0], rotate: [0, -6, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <Feather className="w-5 h-5 text-accent" aria-hidden="true" />
                </motion.span>
                <div className="space-y-0.5">
                  <div className="font-hand text-xl leading-none">Sorting the pages…</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Loading your sketches</div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {loading ? (
            <div key="loading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list" aria-label="Loading sketches">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-muted/40 animate-pulse border-2 border-dashed border-black/10"
                  role="listitem"
                  aria-label="Loading sketch"
                />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 bg-accent/5 rounded-[2rem] border-2 border-dashed border-black/20"
            >
              <div className="bg-white dark:bg-black w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 sketch-border sketch-shadow-sm">
                <PenLine className="w-10 h-10 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-3xl font-hand">The inkwell is dry...</h3>
              <p className="text-muted-foreground text-lg max-w-sm mx-auto mt-2">
                Your sketchbook is waiting for its first spill. What will you create today?
              </p>
              <Button
                variant="link"
                onClick={handleNewPost}
                className="mt-6 text-accent font-bold text-lg hover:underline underline-offset-8"
                aria-label="Create your first sketch"
              >
                Start Your First Masterpiece
              </Button>
            </motion.div>
          ) : view === 'grid' ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              role="list"
              aria-label="Sketch gallery"
            >
              {filteredPosts.map((post) => (
                <motion.div key={post.id} variants={itemVariants} whileHover={{ scale: 1.02 }} className="h-full" role="listitem">
                  <IllustrativeCard
                    onClick={() => openPost(post.id)}
                    className="cursor-pointer h-full flex flex-col group border-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openPost(post.id);
                    }}
                    aria-label={`Open sketch ${post.title || 'Untitled'}`}
                    title={`Open ${post.title || 'Untitled'} sketch`}
                  >
                    <IllustrativeHeader className="flex justify-between items-start pt-6">
                      <h3 className="text-2xl font-hand line-clamp-1 group-hover:text-accent transition-colors">{post.title}</h3>
                      <Badge
                        variant={post.status === 'published' ? 'default' : 'secondary'}
                        className="sketch-border sketch-shadow-sm text-[10px] uppercase font-bold py-1"
                      >
                        {post.status || 'draft'}
                      </Badge>
                    </IllustrativeHeader>
                    <IllustrativeContent className="flex-1 min-h-[100px] py-6">
                      <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed italic">
                        {post.summary || 'This page is blank, but it holds the weight of a million possibilities. Click to start writing.'}
                      </p>
                    </IllustrativeContent>
                    <IllustrativeFooter className="py-4">
                      <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1.5" aria-hidden="true" />
                        Last edit: {format(post.lastActive, 'MMM d, yyyy')}
                      </div>
                      <div className="flex gap-1.5">
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[9px] py-0 px-2 font-bold bg-accent/5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </IllustrativeFooter>
                  </IllustrativeCard>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="sketch-border sketch-shadow bg-card rounded-2xl overflow-hidden border-2"
              aria-label="Sketch index"
            >
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">Sketch index table</caption>
                <thead className="bg-accent/10 border-b-2 border-black">
                  <tr>
                    <th scope="col" className="p-6 font-hand text-2xl">
                      Title
                    </th>
                    <th scope="col" className="p-6 font-hand text-2xl">
                      Status
                    </th>
                    <th scope="col" className="p-6 font-hand text-2xl">
                      Tags
                    </th>
                    <th scope="col" className="p-6 font-hand text-2xl">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      onClick={() => openPost(post.id)}
                      className="border-b border-black/10 hover:bg-accent/5 cursor-pointer transition-colors focus-within:bg-accent/5"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openPost(post.id);
                      }}
                      aria-label={`Open sketch ${post.title || 'Untitled'} from index`}
                      title={`Open ${post.title || 'Untitled'} sketch`}
                    >
                      <td className="p-6 font-hand text-xl">{post.title}</td>
                      <td className="p-6">
                        <Badge variant="outline" className="uppercase text-[10px] font-bold">
                          {post.status || 'draft'}
                        </Badge>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags?.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] bg-muted/30">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-6 text-sm text-muted-foreground font-mono">{format(post.lastActive, 'MMM d, HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="pt-6">
          <Alert className="sketch-border bg-white/70 dark:bg-black/30">
            <Info className="h-4 w-4" aria-hidden="true" />
            <AlertTitle className="font-hand text-xl">AI usage note</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              Although InkSpill has AI capabilities, there is a shared limit on the number of requests that can be made to the AI servers across all user apps in a given time period.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AppLayout>
  );
}