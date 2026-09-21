'use client';

import { useState, useCallback } from 'react';
import { uploadPageImage } from '../lib/supabase/storage';

/**
 * Extracts all image nodes from a Tiptap JSON document tree.
 */
export const extractImagesFromJSON = (doc) => {
  const list = [];
  function walk(node) {
    if (node?.type === 'image' && node.attrs?.src) {
      list.push({ src: node.attrs.src, alt: node.attrs.alt || '' });
    }
    if (node?.content) node.content.forEach(walk);
  }
  if (doc) walk(doc);
  return list;
};

/**
 * Hook for managing page images, uploading to Supabase Storage, lightbox, and the side media rail.
 */
export function usePageImages({ user, activeBookId, showToast }) {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [mediaRailOpen, setMediaRailOpen] = useState(false);

  const handleImageFile = useCallback(async (file, editor) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const publicUrl = await uploadPageImage(file, user?.id || 'guest', activeBookId || 'general');
      const newImg = { src: publicUrl, alt: file.name || 'image' };

      if (editor) {
        editor.chain().focus().setImage(newImg).run();
      }
      setUploadedImages(prev => [...prev, newImg]);
      setMediaRailOpen(true);
      if (showToast) {
        showToast('success', 'Image uploaded to cloud storage!');
      }
      return newImg;
    } catch (err) {
      console.error('Failed to upload image:', err);
      if (showToast) {
        showToast('error', 'Image Upload Failed', 'Please verify the page-images bucket exists.');
      }
    } finally {
      setUploadingImage(false);
    }
  }, [user?.id, activeBookId, showToast]);

  const handleDeleteImage = useCallback((srcToDelete, editor, onTriggerSave, metadata = {}) => {
    if (!editor) return;
    try {
      const { state, dispatch } = editor.view;
      const { tr, doc } = state;
      const positionsToDelete = [];

      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs?.src === srcToDelete) {
          positionsToDelete.unshift({ pos, size: node.nodeSize });
        }
      });

      if (positionsToDelete.length > 0) {
        positionsToDelete.forEach(({ pos, size }) => {
          tr.delete(pos, pos + size);
        });
        dispatch(tr);
      }

      setUploadedImages(prev => prev.filter(img => img.src !== srcToDelete));
      const newJSON = JSON.stringify(editor.getJSON());
      if (onTriggerSave) {
        onTriggerSave(newJSON, metadata.tags, metadata.title, metadata.color, metadata.starred);
      }
      if (showToast) {
        showToast('success', 'Image removed from note');
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
      if (showToast) {
        showToast('error', 'Could not delete image', err.message);
      }
    }
  }, [showToast]);

  return {
    uploadedImages,
    setUploadedImages,
    uploadingImage,
    lightboxImg,
    setLightboxImg,
    mediaRailOpen,
    setMediaRailOpen,
    extractImagesFromJSON,
    handleImageFile,
    handleDeleteImage,
  };
}

export default usePageImages;
