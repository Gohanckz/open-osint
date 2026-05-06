'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from './Dialog.js';
import { Input } from './Input.js';
import { cn } from '../cn.js';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  keywords?: string[];
  onSelect: () => void;
}

export function CommandPalette({
  items,
  open,
  onOpenChange,
}: {
  items: CommandItem[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = q
    ? items.filter((i) =>
        [i.label, i.hint, ...(i.keywords ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : items;

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0">
        <div className="border-b border-border-subtle p-2">
          <Input
            autoFocus
            placeholder="Buscar tableros, nodos, comandos..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="p-4 text-center text-sm text-text-muted">Sin resultados</li>
          ) : (
            filtered.map((item) => (
              <li
                key={item.id}
                onClick={() => {
                  item.onSelect();
                  onOpenChange(false);
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm',
                  'hover:bg-bg-surface',
                )}
              >
                <span>{item.label}</span>
                {item.hint && <span className="text-xs text-text-muted">{item.hint}</span>}
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
