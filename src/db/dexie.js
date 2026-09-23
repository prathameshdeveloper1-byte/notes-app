import Dexie from 'dexie';

export const db = new Dexie('BookNotesDB');

db.version(1).stores({
  books:   '++id, title, coverColor, createdAt, updatedAt',
  folders: '++id, bookId, title, orderIndex, createdAt',
  pages:   '++id, folderId, bookId, title, *tags, orderIndex, starred, deletedAt, createdAt, updatedAt',
  images:  '++id, pageId, createdAt',
});

db.version(2).stores({
  chapterTopics: 'folderId, updatedAt',
});

export default db;
