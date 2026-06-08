import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Pin, FileJson, Plus } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

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
}

const SortableTab = ({ 
  tab, 
  isActive, 
  onSelect, 
  onClose, 
  onContextMenu, 
  onRename 
}: { 
  tab: TabData; 
  isActive: boolean; 
  onSelect: () => void; 
  onClose: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRename: (newName: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tab.name);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleRenameSubmit = () => {
    setIsEditing(false);
    if (editName.trim() && editName !== tab.name) {
      onRename(editName.trim());
    } else {
      setEditName(tab.name); // revert
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={() => onSelect()}
      onContextMenu={onContextMenu}
      onDoubleClick={handleDoubleClick}
      className={`group relative flex items-center min-w-[140px] max-w-[220px] h-11 px-3 border-r border-slate-200 dark:border-white/5 cursor-pointer select-none transition-colors duration-150
        ${isActive 
          ? 'bg-white dark:bg-slate-900 text-primary dark:text-slate-200 border-t-[1.5px] border-t-primary dark:border-t-violet-500 shadow-sm dark:shadow-[0_-1px_10px_rgba(139,92,246,0.15)] z-10' 
          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 border-t-[1.5px] border-t-transparent'}
        ${isDragging ? 'opacity-50 z-50' : ''}
      `}
    >
      <FileJson className="w-4 h-4 mr-2 flex-shrink-0 opacity-70" />
      
      {isEditing ? (
        <input
          type="text"
          value={editName}
          autoFocus
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
            if (e.key === 'Escape') {
              setEditName(tab.name);
              setIsEditing(false);
            }
          }}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium"
        />
      ) : (
        <span className="flex-1 truncate text-sm font-medium pr-2">
          {tab.name}
        </span>
      )}

      {tab.isPinned && <Pin className="w-3 h-3 ml-1 text-slate-400 flex-shrink-0" />}

      <div className="flex items-center ml-1 w-5 h-5 justify-center flex-shrink-0">
        {tab.isUnsaved ? (
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary dark:bg-violet-500' : 'bg-slate-400 dark:bg-slate-500'} group-hover:hidden`} />
        ) : null}
        <button
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
          onClick={onClose}
          className={`w-5 h-5 rounded-md flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors
            ${tab.isUnsaved ? 'hidden group-hover:flex' : 'opacity-0 group-hover:opacity-100'}
            ${isActive && !tab.isUnsaved ? 'opacity-100' : ''}
          `}
        >
          <X className="w-3.5 h-3.5" />
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
  onNewTab
}: JSONTabsProps) => {
  const sensors = useSensors(
    usePointerSensorWithDelay(),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex(t => t.id === active.id);
      const newIndex = tabs.findIndex(t => t.id === over.id);
      onTabsReorder(arrayMove(tabs, oldIndex, newIndex));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const getContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const tab = tabs.find(t => t.id === contextMenu.tabId);
    if (!tab) return [];

    return [
      { label: 'Close', onClick: () => onTabClose(tab.id) },
      { label: 'Close Others', onClick: () => onTabCloseOthers(tab.id), disabled: tabs.length <= 1 },
      { divider: true, onClick: () => {} },
      { label: tab.isPinned ? 'Unpin' : 'Pin', onClick: () => onTabPinToggle(tab.id) },
      { label: 'Duplicate', onClick: () => onTabDuplicate(tab.id) },
    ];
  };

  // Sort tabs so pinned tabs are first? Native VS code usually just groups them. We'll rely on the user to sort them for now.

  return (
    <>
      <div className="flex w-full items-center bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 overflow-x-auto scrollbar-none h-11 select-none">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={tabs.map(t => t.id)}
            strategy={horizontalListSortingStrategy}
          >
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
                onContextMenu={(e) => handleContextMenu(e, tab.id)}
                onRename={(newName) => onTabRename(tab.id, newName)}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        <button
          onClick={onNewTab}
          className="w-11 h-11 flex flex-shrink-0 items-center justify-center hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          title="New Tab (Ctrl+T)"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};

// Custom sensor to prevent dragging when clicking buttons/inputs
function usePointerSensorWithDelay() {
  return useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // 5px movement required before dragging starts (allows clicks)
    },
  });
}
