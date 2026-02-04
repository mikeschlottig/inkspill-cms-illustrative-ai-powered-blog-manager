import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface ViewToggleProps {
  view: 'grid' | 'table';
  onChange: (view: 'grid' | 'table') => void;
}
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border-2 border-black dark:border-white sketch-shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('grid')}
        className={cn(
          "h-8 px-3 transition-all",
          view === 'grid' ? "bg-white dark:bg-black sketch-border sketch-shadow-sm" : "hover:bg-accent/50"
        )}
      >
        <LayoutGrid className="w-4 h-4 mr-2" />
        Gallery
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('table')}
        className={cn(
          "h-8 px-3 transition-all",
          view === 'table' ? "bg-white dark:bg-black sketch-border sketch-shadow-sm" : "hover:bg-accent/50"
        )}
      >
        <List className="w-4 h-4 mr-2" />
        Index
      </Button>
    </div>
  );
}