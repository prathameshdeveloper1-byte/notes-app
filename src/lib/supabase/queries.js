import { createClient } from './client';

const supabase = createClient();

// Helper: map DB snake_case to app camelCase
function mapBook(b) {
  if (!b) return null;
  return {
    id: b.id,
    userId: b.user_id,
    title: b.title,
    coverColor: b.cover_color,
    createdAt: new Date(b.created_at).getTime(),
    updatedAt: new Date(b.updated_at).getTime(),
  };
}

function mapFolder(f) {
  if (!f) return null;
  return {
    id: f.id,
    bookId: f.book_id,
    userId: f.user_id,
    title: f.title,
    orderIndex: f.order_index,
    createdAt: new Date(f.created_at).getTime(),
  };
}

function mapPage(p) {
  if (!p) return null;
  return {
    id: p.id,
    folderId: p.folder_id,
    bookId: p.book_id,
    userId: p.user_id,
    title: p.title,
    contentJSON: typeof p.content_json === 'string' ? p.content_json : JSON.stringify(p.content_json || {}),
    tags: p.tags || [],
    starred: !!p.starred,
    color: p.color || null,
    orderIndex: p.order_index,
    createdAt: new Date(p.created_at).getTime(),
    updatedAt: new Date(p.updated_at).getTime(),
  };
}

// ── Books ─────────────────────────────────────────────────────────────────────
export async function getAllBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getAllBooks error:', error);
    return [];
  }
  return (data || []).map(mapBook);
}

export async function createBook({ title, coverColor }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('books')
    .insert({
      title,
      cover_color: coverColor,
      user_id: user?.id,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateBook(id, changes) {
  const dbChanges = { updated_at: new Date().toISOString() };
  if (changes.title !== undefined) dbChanges.title = changes.title;
  if (changes.coverColor !== undefined) dbChanges.cover_color = changes.coverColor;

  const { error } = await supabase
    .from('books')
    .update(dbChanges)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteBook(id) {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

// ── Folders ───────────────────────────────────────────────────────────────────
export async function getFoldersByBook(bookId) {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('getFoldersByBook error:', error);
    return [];
  }
  return (data || []).map(mapFolder);
}

export async function createFolder({ bookId, title }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { count } = await supabase
    .from('folders')
    .select('*', { count: 'exact', head: true })
    .eq('book_id', bookId);

  const { data, error } = await supabase
    .from('folders')
    .insert({
      book_id: bookId,
      title,
      order_index: count || 0,
      user_id: user?.id,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateFolder(id, changes) {
  const dbChanges = {};
  if (changes.title !== undefined) dbChanges.title = changes.title;
  if (changes.orderIndex !== undefined) dbChanges.order_index = changes.orderIndex;

  const { error } = await supabase
    .from('folders')
    .update(dbChanges)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteFolder(id) {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderFolders(bookId, orderedIds) {
  const updates = orderedIds.map((id, index) =>
    supabase.from('folders').update({ order_index: index }).eq('id', id)
  );
  await Promise.all(updates);
}

// ── Pages ─────────────────────────────────────────────────────────────────────
export async function getPagesByFolder(folderId) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('folder_id', folderId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('getPagesByFolder error:', error);
    return [];
  }
  return (data || []).map(mapPage);
}

export async function getPagesByBook(bookId) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('getPagesByBook error:', error);
    return [];
  }
  return (data || []).map(mapPage);
}

export async function getPage(id) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapPage(data);
}

export async function createPage({ bookId, folderId, title = 'Untitled Page' }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { count } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .eq('folder_id', folderId);

  const initialContent = { type: 'doc', content: [{ type: 'paragraph' }] };

  const { data, error } = await supabase
    .from('pages')
    .insert({
      book_id: bookId,
      folder_id: folderId,
      title,
      content_json: initialContent,
      tags: [],
      order_index: count || 0,
      user_id: user?.id,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updatePage(id, changes) {
  const dbChanges = { updated_at: new Date().toISOString() };
  if (changes.title !== undefined) dbChanges.title = changes.title;
  if (changes.tags !== undefined) dbChanges.tags = changes.tags;
  if (changes.starred !== undefined) dbChanges.starred = changes.starred;
  if (changes.color !== undefined) dbChanges.color = changes.color;
  if (changes.orderIndex !== undefined) dbChanges.order_index = changes.orderIndex;
  if (changes.contentJSON !== undefined) {
    try {
      dbChanges.content_json = typeof changes.contentJSON === 'string'
        ? JSON.parse(changes.contentJSON)
        : changes.contentJSON;
    } catch {
      dbChanges.content_json = changes.contentJSON;
    }
  }

  const { error } = await supabase
    .from('pages')
    .update(dbChanges)
    .eq('id', id);

  if (error) throw error;
}

export async function deletePage(id) {
  const { error } = await supabase.from('pages').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderPages(folderId, orderedIds) {
  const updates = orderedIds.map((id, index) =>
    supabase.from('pages').update({ order_index: index }).eq('id', id)
  );
  await Promise.all(updates);
}

export async function getRecentPages(limit = 5) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRecentPages error:', error);
    return [];
  }
  return (data || []).map(mapPage);
}

export async function getPublicPage(id) {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    const page = mapPage(data);

    if (page.bookId) {
      const { data: book } = await supabase.from('books').select('title, cover_color').eq('id', page.bookId).single();
      if (book) {
        page.bookTitle = book.title;
        page.coverColor = book.cover_color;
      }
    }
    if (page.folderId) {
      const { data: folder } = await supabase.from('folders').select('title').eq('id', page.folderId).single();
      if (folder) {
        page.folderTitle = folder.title;
      }
    }
    return page;
  } catch (err) {
    console.error('getPublicPage error:', err);
    return null;
  }
}

// ── User Preferences (Stored in Supabase Auth user_metadata) ─────────────────
export async function saveUserPreference(key, value) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const currentPrefs = user.user_metadata?.preferences || {};
    const updatedPrefs = { ...currentPrefs, [key]: value };
    await supabase.auth.updateUser({
      data: {
        preferences: updatedPrefs,
      },
    });
  } catch (err) {
    console.error('saveUserPreference error:', err);
  }
}

export async function getUserPreferences() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return user.user_metadata?.preferences || null;
  } catch (err) {
    console.error('getUserPreferences error:', err);
    return null;
  }
}


