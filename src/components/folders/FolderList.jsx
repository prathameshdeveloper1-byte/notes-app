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

export default function FolderList() {
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
    <div className="px-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {folders.length === 0 ? (
            <div className="py-6 text-center">
              <FolderOpen size={32} className="mx-auto text-ink-300 dark:text-ink-700 mb-2" />
              <p className="text-xs text-ink-400">No chapters yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {folders.map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isActive={activeFolderId === folder.id}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

      <button
        onClick={() => setCreateOpen(true)}
        className="flex items-center gap-1.5 w-full mt-2 px-3 py-2 text-xs text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 rounded-xl transition"
      >
        <Plus size={13} />
        Add Chapter
      </button>

      <FolderCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
