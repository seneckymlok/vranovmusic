// Supabase Client Configuration
// ================================
// You need to set up these environment variables in your .env file:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key
//
// Get these from: https://supabase.com/dashboard/project/_/settings/api

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Only create client if credentials are present
export const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase credentials not found. Running in local-only mode. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file for cloud sync.');
}

// Database Types
export interface ShowRow {
    id: string;
    date: string;
    time: string | null;
    venue: string;
    city: string;
    country: string;
    ticket_url: string | null;
    flyer_image: string | null;
    description: string | null;
    is_past: boolean;
    created_at: string;
    updated_at: string;
}

export interface FolderRow {
    id: string;
    name: string;
    category: 'photos' | 'videos' | 'flyers';
    created_at: string;
}

export interface PhotoRow {
    id: string;
    folder_id: string;
    title: string;
    url: string;
    thumbnail_url: string | null;
    created_at: string;
}

export interface ArchiveFolderRow {
    id: string;
    name: string;
    description: string | null;
    category: 'photos' | 'videos' | 'flyers';
    event_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface ArchivePhotoRow {
    id: string;
    folder_id: string;
    title: string;
    description: string | null;
    photo_date: string | null;
    url: string;
    thumbnail_url: string | null;
    file_size: number | null;
    display_order: number;
    created_at: string;
    updated_at: string;
}

// Storage bucket name for archive photos
export const ARCHIVE_STORAGE_BUCKET = 'archive-photos';

// --- NEWS FEED TYPES & HELPERS ---

export interface NewsPost {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    likes: number;
    created_at: string;
}

export interface NewsComment {
    id: string;
    post_id: string;
    author_name: string;
    content: string;
    created_at: string;
}

// 1. Fetch Posts
export const fetchNewsPosts = async (): Promise<NewsPost[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('news_posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching news:', error);
        return [];
    }

    return data as NewsPost[];
};

// 2. Create Post
export const createNewsPost = async (post: Omit<NewsPost, 'id' | 'likes' | 'created_at'>): Promise<NewsPost | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('news_posts')
        .insert([{ ...post, likes: 0 }])
        .select()
        .single();

    if (error) {
        console.error('Error creating news post:', error);
        return null;
    }

    return data as NewsPost;
};

// 3. Delete Post
export const deleteNewsPost = async (id: string): Promise<boolean> => {
    if (!supabase) return false;

    const { error } = await supabase
        .from('news_posts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting news post:', error);
        return false;
    }

    return true;
};

// 4. Like Post
export const likeNewsPost = async (id: string, currentLikes: number): Promise<number | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('news_posts')
        .update({ likes: currentLikes + 1 })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error liking news post:', error);
        return null;
    }

    return (data as NewsPost).likes;
};

// 5. Fetch Comments
export const fetchComments = async (postId: string): Promise<NewsComment[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('news_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }); // Oldest first (chronological)

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }

    return data as NewsComment[];
};

// 6. Post Comment
export const createComment = async (comment: Omit<NewsComment, 'id' | 'created_at'>): Promise<NewsComment | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('news_comments')
        .insert([comment])
        .select()
        .single();

    if (error) {
        console.error('Error creating comment:', error);
        return null;
    }

    return data as NewsComment;
};

// 7. Upload Image
export const uploadNewsImage = async (file: File): Promise<string | null> => {
    if (!supabase) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('news-media')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('news-media')
        .getPublicUrl(filePath);

    return data.publicUrl;
};
