import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, FileJson, Pencil, Pin, PinOff, Plus, X, XCircle } from 'lucide-react';
import { IconButton, cn } from '../../components/ui';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

export interface TabData {
  id: string;
  name: string;
  content: string;
  isPinned: boolean;
  isUnsaved: boolean;
}

interface JSONTabsProps {
  tabs: TabData[];
  activeTabId: string;
  onTabsReorder: (tabs: TabData[]) => void;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabCloseOthers: (id: string) => void;
  onTabDuplicate: (id: string) => void;
  onTabPinToggle: (id: string) => void;
  onTabRename: (id: string, newName: string) => void;
  onNewTab: () => void;
  rightElement?: React.ReactNode;
}

interface SortableTabProps {
  tab: TabData;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (newName: string) => void;
}

const SortableTab = ({ tab, isActive, onSelect, onClose, onContextMenu, isEditing, onStartEdit, onCancelEdit, onSubmitEdit }: SortableTabProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });
  const [editName, setEditName] = useState(tab.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) return;
    setEditName(tab.name);
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const dot = tab.name.lastIndexOf('.');
    if (dot > 0) input.setSelectionRange(0, dot);
    else input.select();
  }, [isEditing, tab.name]);

  const submit = () => {
    if (editName.trim() && editName !== tab.name) onSubmitEdit(editName.trim());
    else onCancelEdit();
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="tab"
      aria-selected={isActive}
      onMouseDown={onSelect}
      onContextMenu={onContextMenu}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit();
      }}
      className={cn(
        'group relative flex h-full min-w-[132px] max-w-[220px] cursor-pointer select-none items-center gap-2 border-r border-border-subtle px-3 transition-colors duration-150',
        isActive ? 'bg-surface-1 text-foreground' : 'text-muted-foreground hover:bg-surface-1/60 hover:text-foreground',
        isDragging && 'z-50 opacity-60',
      )}
    >
      {/* Active accent line */}
      {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]" />}
      <FileJson className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary' : 'opacity-70')} />

      {isEditing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          aria-label="Tab name"
          className="min-w-0 flex-1 rounded bg-background px-1 text-13 font-medium outline-none ring-1 ring-primary/50"
        />
      ) : (
        <span className="flex-1 truncate text-13 font-medium">{tab.name}</span>
      )}

      {tab.isPinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />}

      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        {tab.isUnsaved && <span className={cn('h-2 w-2 rounded-full group-hover:hidden', isActive ? 'bg-primary' : 'bg-muted-foreground')} />}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label={`Close ${tab.name}`}
          className={cn(
            'h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground',
            tab.isUnsaved ? 'hidden group-hover:flex' : 'flex opacity-0 group-hover:opacity-100',
            isActive && !tab.isUnsaved && 'opacity-100',
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export const JSONTabs = ({
  tabs,
  activeTabId,
  onTabsReorder,
  onTabSelect,
  onTabClose,
  onTabCloseOthers,
  onTabDuplicate,
  onTabPinToggle,
  onTabRename,
  onNewTab,
  rightElement,
}: JSONTabsProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setContextMenu(null), []);

  // F2 renames the active tab (capture phase so Monaco doesn't swallow it)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'F2') return;
      e.preventDefault();
      e.stopPropagation();
      setEditingTabId(activeTabId);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activeTabId]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = tabs.findIndex((t) => t.id === active.id);
    const to = tabs.findIndex((t) => t.id === over.id);
    onTabsReorder(arrayMove(tabs, from, to));
  };

  const menuTab = contextMenu ? tabs.find((t) => t.id === contextMenu.tabId) : undefined;
  const menuItems: ContextMenuItem[] = menuTab
    ? [
        { label: 'Rename', icon: <Pencil />, shortcut: 'F2', onClick: () => setEditingTabId(menuTab.id) },
        { label: 'Duplicate', icon: <Copy />, onClick: () => onTabDuplicate(menuTab.id) },
        { label: menuTab.isPinned ? 'Unpin' : 'Pin', icon: menuTab.isPinned ? <PinOff /> : <Pin />, onClick: () => onTabPinToggle(menuTab.id) },
        { divider: true, onClick: () => undefined },
        { label: 'Close others', icon: <XCircle />, onClick: () => onTabCloseOthers(menuTab.id), disabled: tabs.length <= 1 },
        { label: 'Close', icon: <X />, shortcut: 'Ctrl+W', destructive: true, onClick: () => onTabClose(menuTab.id) },
      ]
    : [];

  return (
    <>
      <div className="flex h-10 w-full shrink-0 select-none items-stretch justify-between border-b border-border bg-background">
        <div role="tablist" className="no-scrollbar flex min-w-0 flex-1 items-stretch overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
              {tabs.map((tab) => (
                <SortableTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeTabId === tab.id}
                  onSelect={() => onTabSelect(tab.id)}
                  onClose={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
                  }}
                  isEditing={editingTabId === tab.id}
                  onStartEdit={() => setEditingTabId(tab.id)}
                  onCancelEdit={() => setEditingTabId(null)}
                  onSubmitEdit={(name) => {
                    setEditingTabId(null);
                    onTabRename(tab.id, name);
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="flex items-center px-1">
            <IconButton label="New tab" shortcut="ctrl+t" size="sm" onClick={onNewTab}>
              <Plus />
            </IconButton>
          </div>
        </div>
        {rightElement && <div className="flex shrink-0 items-center border-l border-border-subtle px-1.5">{rightElement}</div>}
      </div>

      {contextMenu && menuTab && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={menuItems} onClose={closeMenu} />}
    </>
  );
};
