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
import { Plus, BookOpen, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { playTabClickSound } from '../../lib/soundEffects';

export default function FolderList({
  collapsed = false,
  createModalOpen,
  setCreateModalOpen,
  accentColor = '#6366f1',
}) {
  const { folders, fetchFolders, reorder } = useFolderStore();
  const { activeBookId, soundEnabled } = useUIStore();
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);

  const isModalOpen = createModalOpen !== undefined ? createModalOpen : internalCreateOpen;
  const setIsModalOpen = setCreateModalOpen !== undefined ? setCreateModalOpen : setInternalCreateOpen;

  useEffect(() => {
    if (activeBookId) fetchFolders(activeBookId);
  }, [activeBookId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = folders.findIndex((f) => f.id === active.id);
    const newIdx = folders.findIndex((f) => f.id === over.id);
    const newOrder = arrayMove(folders, oldIdx, newIdx);
    await reorder(activeBookId, newOrder.map((f) => f.id));
  };

  const handleOpenCreate = () => {
    if (soundEnabled) playTabClickSound();
    setIsModalOpen(true);
  };

  return (
    <div className={cn('transition-all', collapsed ? 'px-1.5' : 'px-2.5')}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={folders.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {folders.length === 0 ? (
            <div className={cn('py-8 text-center rounded-2xl border border-dashed border-paper-300 dark:border-ink-800 bg-white/40 dark:bg-ink-800/20 my-2', collapsed ? 'px-1' : 'px-3')}>
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-paper-100 dark:bg-ink-800 flex items-center justify-center text-ink-400 dark:text-paper-400">
                <Layers size={18} />
              </div>
              {!collapsed && (
                <>
                  <p className="text-xs font-serif font-semibold text-ink-700 dark:text-paper-200">
                    No chapters yet
                  </p>
                  <p className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5 mb-3">
                    Organize your notebook into sections
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-ink-800 text-white dark:bg-paper-100 dark:text-ink-900 shadow-xs hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Plus size={13} />
                    <span>Create Chapter</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder, index) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  index={index}
                  collapsed={collapsed}
                  accentColor={accentColor}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

      {/* Tactile Add Chapter Button */}
      <button
        onClick={handleOpenCreate}
        className={cn(
          'group flex items-center justify-center font-semibold rounded-xl border border-dashed border-paper-300 dark:border-ink-700 bg-white/60 dark:bg-ink-800/30 hover:bg-white dark:hover:bg-ink-800 text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-white hover:border-amber-400/80 dark:hover:border-amber-500/80 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-[0.98]',
          collapsed
            ? 'w-full mt-2.5 p-2 text-xs'
            : 'w-full mt-2.5 px-3 py-2 text-xs gap-2'
        )}
        title="Add New Chapter"
      >
        <Plus
          size={14}
          className="text-ink-500 dark:text-paper-400 group-hover:rotate-90 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform duration-200"
        />
        {!collapsed && <span>Add Chapter</span>}
      </button>

      {createModalOpen === undefined && (
        <FolderCreateModal open={internalCreateOpen} onClose={() => setInternalCreateOpen(false)} />
      )}
    </div>
  );
}
