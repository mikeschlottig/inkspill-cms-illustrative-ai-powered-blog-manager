import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b-2 border-black flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="sketch-button">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-hand">The Canvas</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="sketch-button bg-white">Save Draft</Button>
            <Button className="sketch-button bg-secondary text-white font-bold">Publish</Button>
          </div>
        </header>
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-6">
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sketch Title..." 
            className="text-4xl font-hand h-auto border-none focus-visible:ring-0 bg-transparent px-0 placeholder:opacity-30"
          />
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Once upon a time in a digital sketchbook..."
            className="flex-1 min-h-[500px] text-lg leading-relaxed border-none focus-visible:ring-0 bg-transparent px-0 resize-none placeholder:opacity-20"
          />
        </main>
      </div>
      {/* The Muse Sidebar (Placeholder) */}
      <aside className="w-80 border-l-2 border-black bg-accent/5 flex flex-col">
        <div className="p-4 border-b-2 border-black flex items-center gap-2 bg-white">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-hand text-xl">The Muse</h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-white p-3 rounded-lg sketch-border sketch-shadow-sm text-sm italic">
            "Every great story begins with a single drop of ink. How can I help you refine this sketch?"
          </div>
        </div>
        <div className="p-4 bg-white border-t-2 border-black">
          <div className="relative">
            <Input placeholder="Ask the Muse..." className="pr-10 sketch-border" />
            <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}