import { createClient } from './client';

export async function uploadPageImage(file, userId, bookId) {
  const supabase = createClient();
  const fileExt = file.name ? file.name.split('.').pop() : 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${userId}/${bookId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('page-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image to Supabase Storage:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('page-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deletePageImage(filePath) {
  const supabase = createClient();
  const { error } = await supabase.storage.from('page-images').remove([filePath]);
  if (error) console.error('Error deleting image from Supabase Storage:', error);
}
