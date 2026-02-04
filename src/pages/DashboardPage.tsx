import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Clock, Tag } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { IllustrativeCard, IllustrativeHeader, IllustrativeContent, IllustrativeFooter } from '@/components/ui/illustrative-card';
import { ViewToggle } from '@/components/ViewToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPosts, createPost } from '@/lib/cms-api';
import type { SessionInfo } from '../../worker/types';
import { format } from 'date-fns';
export function DashboardPage() {
  const [posts, setPosts] = useState<SessionInfo[]>([]);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    loadPosts();
  }, []);
  const loadPosts = async () => {
    setLoading(true);
    const data = await getPosts();
    setPosts(data);
    setLoading(false);
  };
  const handleNewPost = async () => {
    const post = await createPost();
    if (post) navigate(`/editor/${post.id}`);
  };
  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <AppLayout container>
      <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-hand">The Sketchbook</h1>
            <p className="text-muted-foreground">Manage your creative thoughts and drafts.</p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onChange={setView} />
            <Button onClick={handleNewPost} className="sketch-button bg-accent text-accent-foreground font-bold px-6">
              <Plus className="w-5 h-5 mr-2" />
              New Sketch
            </Button>
          </div>
        </header>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search sketches or tags..." 
            className="pl-10 h-12 border-2 border-black sketch-shadow-sm bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse border-2 border-dashed border-muted-foreground/30" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-24 bg-accent/5 rounded-3xl border-2 border-dashed border-black/20">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-hand">No sketches found</h3>
            <p className="text-muted-foreground">Start your first adventure today.</p>
            <Button variant="link" onClick={handleNewPost} className="mt-2">Create New Sketch</Button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <IllustrativeCard key={post.id} onClick={() => navigate(`/editor/${post.id}`)} className="cursor-pointer group">
                <IllustrativeHeader className="flex justify-between items-start">
                  <h3 className="text-xl font-hand line-clamp-1">{post.title}</h3>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="sketch-border sketch-shadow-sm text-[10px] uppercase">
                    {post.status || 'draft'}
                  </Badge>
                </IllustrativeHeader>
                <IllustrativeContent className="min-h-[80px]">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.summary || "No summary written yet. Click to start drafting this piece."}
                  </p>
                </IllustrativeContent>
                <IllustrativeFooter>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(post.lastActive, 'MMM d, yyyy')}
                  </div>
                  <div className="flex gap-1">
                    {post.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px] py-0">{tag}</Badge>
                    ))}
                  </div>
                </IllustrativeFooter>
              </IllustrativeCard>
            ))}
          </div>
        ) : (
          <div className="sketch-border sketch-shadow bg-card rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-accent/10 border-b-2 border-black">
                <tr>
                  <th className="p-4 font-hand text-lg">Title</th>
                  <th className="p-4 font-hand text-lg">Status</th>
                  <th className="p-4 font-hand text-lg">Tags</th>
                  <th className="p-4 font-hand text-lg">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr 
                    key={post.id} 
                    onClick={() => navigate(`/editor/${post.id}`)}
                    className="border-b border-black/10 hover:bg-accent/5 cursor-pointer"
                  >
                    <td className="p-4 font-medium">{post.title}</td>
                    <td className="p-4 uppercase text-xs font-bold tracking-wider">{post.status || 'draft'}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {post.tags?.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{format(post.lastActive, 'MMM d, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}