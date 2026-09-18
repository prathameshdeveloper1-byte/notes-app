import { db } from './dexie';

// Books
export async function getAllBooks() {
  return db.books.orderBy('createdAt').toArray();
}

export async function createBook({ title, coverColor }) {
  const now = Date.now();
  return db.books.add({ title, coverColor, createdAt: now, updatedAt: now });
}

export async function updateBook(id, changes) {
  return db.books.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteBook(id) {
  const folders = await db.folders.where('bookId').equals(id).toArray();
  const folderIds = folders.map(f => f.id);
  const pages = await db.pages.where('bookId').equals(id).toArray();
  const pageIds = pages.map(p => p.id);
  await db.transaction('rw', db.books, db.folders, db.pages, db.images, async () => {
    if (pageIds.length > 0) {
      await db.images.where('pageId').anyOf(pageIds).delete();
    }
    await db.pages.where('bookId').equals(id).delete();
    await db.folders.where('bookId').equals(id).delete();
    await db.books.delete(id);
  });
}

// Folders
export async function getFoldersByBook(bookId) {
  return db.folders.where('bookId').equals(bookId).sortBy('orderIndex');
}

export async function createFolder({ bookId, title }) {
  const existing = await db.folders.where('bookId').equals(bookId).count();
  const now = Date.now();
  return db.folders.add({ bookId, title, orderIndex: existing, createdAt: now });
}

export async function updateFolder(id, changes) {
  return db.folders.update(id, changes);
}

export async function deleteFolder(id) {
  await db.transaction('rw', db.folders, db.pages, db.images, async () => {
    const pages = await db.pages.where('folderId').equals(id).toArray();
    const pageIds = pages.map(p => p.id);
    if (pageIds.length > 0) {
      await db.images.where('pageId').anyOf(pageIds).delete();
    }
    await db.pages.where('folderId').equals(id).delete();
    await db.folders.delete(id);
  });
}

export async function reorderFolders(bookId, orderedIds) {
  await db.transaction('rw', db.folders, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.folders.update(orderedIds[i], { orderIndex: i });
    }
  });
}

// Pages
export async function getPagesByFolder(folderId) {
  return db.pages
    .where('folderId')
    .equals(folderId)
    .filter(p => !p.deletedAt)
    .sortBy('orderIndex');
}

export async function getPagesByBook(bookId) {
  return db.pages
    .where('bookId')
    .equals(bookId)
    .filter(p => !p.deletedAt)
    .sortBy('orderIndex');
}

export async function getPage(id) {
  return db.pages.get(id);
}

export async function createPage({ bookId, folderId, title = 'Untitled Page' }) {
  const existing = await db.pages.where('folderId').equals(folderId).count();
  const now = Date.now();
  return db.pages.add({
    bookId,
    folderId,
    title,
    contentJSON: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    tags: [],
    orderIndex: existing,
    starred: false,
    deletedAt: null,
    color: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updatePage(id, changes) {
  return db.pages.update(id, { ...changes, updatedAt: Date.now() });
}

export async function softDeletePage(id) {
  return db.pages.update(id, { deletedAt: Date.now() });
}

export async function restorePage(id) {
  return db.pages.update(id, { deletedAt: null });
}

export async function hardDeletePage(id) {
  await db.transaction('rw', db.pages, db.images, async () => {
    await db.images.where('pageId').equals(id).delete();
    await db.pages.delete(id);
  });
}

export async function reorderPages(folderId, orderedIds) {
  await db.transaction('rw', db.pages, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.pages.update(orderedIds[i], { orderIndex: i });
    }
  });
}

export async function getRecentPages(limit = 5) {
  return db.pages
    .filter(p => !p.deletedAt)
    .reverse()
    .sortBy('updatedAt')
    .then(pages => pages.slice(0, limit));
}

// Images
export async function saveImage({ pageId, blob }) {
  return db.images.add({ pageId, blob, createdAt: Date.now() });
}

export async function getImage(id) {
  return db.images.get(id);
}

export async function deleteImage(id) {
  return db.images.delete(id);
}
