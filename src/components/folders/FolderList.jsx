'use client';
import React, { useEffect, useState } from 'react';
import useFolderStore from '../../store/useFolderStore';
import useUIStore from '../../store/useUIStore';
import FolderItem from './FolderItem';
import FolderCreateModal from './FolderCreateModal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, FolderOpen } from 'lucide-react';

export default function FolderList({ collapsed = false }) {
  const { folders, fetchFolders, reorder } = useFolderStore();
  const { activeBookId, activeFolderId } = useUIStore();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (activeBookId) fetchFolders(activeBookId);
  }, [activeBookId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = folders.findIndex(f => f.id === active.id);
    const newIdx = folders.findIndex(f => f.id === over.id);
    const newOrder = arrayMove(folders, oldIdx, newIdx);
    await reorder(activeBookId, newOrder.map(f => f.id));
  };

  return (
    <div className={collapsed ? 'px-1' : 'px-2'}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {folders.length === 0 ? (
            <div className="py-6 text-center">
              <FolderOpen size={collapsed ? 20 : 32} className="mx-auto text-ink-300 dark:text-ink-700 mb-2" />
              {!collapsed && <p className="text-xs text-ink-400">No chapters yet</p>}
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isActive={activeFolderId === folder.id}
                  collapsed={collapsed}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

      <button
        onClick={() => setCreateOpen(true)}
        className={
          collapsed
            ? 'flex items-center justify-center w-full mt-3 p-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs transition active:scale-[0.98]'
            : 'flex items-center justify-center gap-1.5 w-full mt-3 px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xs transition active:scale-[0.98]'
        }
        title="Add Chapter"
      >
        <Plus size={15} />
        {!collapsed && <span>Add Chapter</span>}
      </button>

      <FolderCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
