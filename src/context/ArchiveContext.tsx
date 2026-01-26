import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, ARCHIVE_STORAGE_BUCKET } from '../lib/supabase';
import type { ArchiveFolderRow, ArchivePhotoRow } from '../lib/supabase';
import type { ArchiveFolder, ArchivePhoto } from '../types';

interface ArchiveContextType {
    folders: ArchiveFolder[];
    photos: ArchivePhoto[];
    loading: boolean;
    error: string | null;
    addFolder: (folder: Omit<ArchiveFolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ArchiveFolder>;
    updateFolder: (id: string, updates: Partial<ArchiveFolder>) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
    uploadPhoto: (folderId: string, file: File, metadata: Omit<ArchivePhoto, 'id' | 'folderId' | 'url' | 'thumbnailUrl' | 'createdAt' | 'updatedAt'>) => Promise<ArchivePhoto>;
    updatePhoto: (id: string, updates: Partial<ArchivePhoto>) => Promise<void>;
    deletePhoto: (id: string) => Promise<void>;
    getPhotosByFolder: (folderId: string) => ArchivePhoto[];
    refreshArchive: () => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextType | undefined>(undefined);

// Convert database row to ArchiveFolder type
const rowToFolder = (row: ArchiveFolderRow): ArchiveFolder => ({
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    category: row.category,
    eventDate: row.event_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// Convert database row to ArchivePhoto type
const rowToPhoto = (row: ArchivePhotoRow): ArchivePhoto => ({
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description || undefined,
    photoDate: row.photo_date || undefined,
    url: row.url,
    thumbnailUrl: row.thumbnail_url || undefined,
    fileSize: row.file_size || undefined,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// Convert ArchiveFolder to database row format
const folderToRow = (folder: Omit<ArchiveFolder, 'id' | 'createdAt' | 'updatedAt'>): Omit<ArchiveFolderRow, 'id' | 'created_at' | 'updated_at'> => ({
    name: folder.name,
    description: folder.description || null,
    category: folder.category,
    event_date: folder.eventDate || null,
});

export const ArchiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [folders, setFolders] = useState<ArchiveFolder[]>([]);
    const [photos, setPhotos] = useState<ArchivePhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch folders from Supabase
    const fetchFolders = useCallback(async () => {
        if (!isSupabaseConfigured || !supabase) {
            setLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('archive_folders')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setFolders(data ? data.map(rowToFolder) : []);
        } catch (err) {
            console.error('Error fetching folders:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch folders');
        }
    }, []);

    // Fetch photos from Supabase
    const fetchPhotos = useCallback(async () => {
        if (!isSupabaseConfigured || !supabase) {
            setLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('archive_photos')
                .select('*')
                .order('display_order', { ascending: true });

            if (fetchError) throw fetchError;

            setPhotos(data ? data.map(rowToPhoto) : []);
        } catch (err) {
            console.error('Error fetching photos:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch photos');
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchFolders(), fetchPhotos()]);
            setLoading(false);
        };
        loadData();
    }, [fetchFolders, fetchPhotos]);

    // Real-time subscriptions
    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) return;

        const client = supabase;

        const foldersChannel = client
            .channel('archive_folders_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'archive_folders' },
                () => fetchFolders()
            )
            .subscribe();

        const photosChannel = client
            .channel('archive_photos_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'archive_photos' },
                () => fetchPhotos()
            )
            .subscribe();

        return () => {
            client.removeChannel(foldersChannel);
            client.removeChannel(photosChannel);
        };
    }, [fetchFolders, fetchPhotos]);

    // Add a new folder
    const addFolder = async (folder: Omit<ArchiveFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<ArchiveFolder> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        try {
            const { data, error: insertError } = await supabase
                .from('archive_folders')
                .insert(folderToRow(folder))
                .select()
                .single();

            if (insertError) throw insertError;

            const newFolder = rowToFolder(data);
            return newFolder;
        } catch (err) {
            console.error('Error adding folder:', err);
            throw err;
        }
    };

    // Update an existing folder
    const updateFolder = async (id: string, updates: Partial<ArchiveFolder>) => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        try {
            const updateData: Record<string, unknown> = {};
            if (updates.name !== undefined) updateData.name = updates.name;
            if (updates.description !== undefined) updateData.description = updates.description || null;
            if (updates.category !== undefined) updateData.category = updates.category;
            if (updates.eventDate !== undefined) updateData.event_date = updates.eventDate || null;

            const { error: updateError } = await supabase
                .from('archive_folders')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating folder:', err);
            throw err;
        }
    };

    // Delete a folder (cascade deletes photos)
    const deleteFolder = async (id: string) => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        try {
            // Get all photos in this folder to delete their files from storage
            const photosToDelete = photos.filter(p => p.folderId === id);

            // Delete files from storage
            for (const photo of photosToDelete) {
                await deletePhotoFile(photo.url);
                if (photo.thumbnailUrl) {
                    await deletePhotoFile(photo.thumbnailUrl);
                }
            }

            // Delete folder (cascade deletes photos from DB)
            const { error: deleteError } = await supabase
                .from('archive_folders')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
        } catch (err) {
            console.error('Error deleting folder:', err);
            throw err;
        }
    };

    // Upload a photo with automatic thumbnail generation
    const uploadPhoto = async (
        folderId: string,
        file: File,
        metadata: Omit<ArchivePhoto, 'id' | 'folderId' | 'url' | 'thumbnailUrl' | 'createdAt' | 'updatedAt'>
    ): Promise<ArchivePhoto> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        try {
            // Generate unique filename
            const timestamp = Date.now();
            const fileExt = file.name.split('.').pop();
            const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${folderId}/${fileName}`;

            // Upload full-size image
            const { error: uploadError } = await supabase.storage
                .from(ARCHIVE_STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(ARCHIVE_STORAGE_BUCKET)
                .getPublicUrl(filePath);

            // Create thumbnail (simplified - in production, use server-side image processing)
            const thumbnailPath = `${folderId}/thumb_${fileName}`;
            const thumbnail = await createThumbnail(file);

            const { error: thumbError } = await supabase.storage
                .from(ARCHIVE_STORAGE_BUCKET)
                .upload(thumbnailPath, thumbnail, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (thumbError) console.warn('Thumbnail upload failed:', thumbError);

            const { data: { publicUrl: thumbnailUrl } } = supabase.storage
                .from(ARCHIVE_STORAGE_BUCKET)
                .getPublicUrl(thumbnailPath);

            // Insert photo record
            const { data, error: insertError } = await supabase
                .from('archive_photos')
                .insert({
                    folder_id: folderId,
                    title: metadata.title,
                    description: metadata.description || null,
                    photo_date: metadata.photoDate || null,
                    url: publicUrl,
                    thumbnail_url: thumbError ? null : thumbnailUrl,
                    file_size: file.size,
                    display_order: metadata.displayOrder,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return rowToPhoto(data);
        } catch (err) {
            console.error('Error uploading photo:', err);
            throw err;
        }
    };

    // Update a photo
    const updatePhoto = async (id: string, updates: Partial<ArchivePhoto>) => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        try {
            const updateData: Record<string, unknown> = {};
            if (updates.title !== undefined) updateData.title = updates.title;
            if (updates.description !== undefined) updateData.description = updates.description || null;
            if (updates.photoDate !== undefined) updateData.photo_date = updates.photoDate || null;
            if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

            const { error: updateError } = await supabase
                .from('archive_photos')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating photo:', err);
            throw err;
        }
    };

    // Delete a photo
    const deletePhoto = async (id: string) => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        try {
            const photo = photos.find(p => p.id === id);
            if (!photo) throw new Error('Photo not found');

            // Delete files from storage
            await deletePhotoFile(photo.url);
            if (photo.thumbnailUrl) {
                await deletePhotoFile(photo.thumbnailUrl);
            }

            // Delete from database
            const { error: deleteError } = await supabase
                .from('archive_photos')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
        } catch (err) {
            console.error('Error deleting photo:', err);
            throw err;
        }
    };

    // Helper: Delete a file from storage
    const deletePhotoFile = async (url: string) => {
        if (!supabase) return;

        try {
            // Extract path from public URL
            const urlParts = url.split(`${ARCHIVE_STORAGE_BUCKET}/`);
            if (urlParts.length < 2) return;

            const filePath = urlParts[1].split('?')[0]; // Remove query params

            await supabase.storage
                .from(ARCHIVE_STORAGE_BUCKET)
                .remove([filePath]);
        } catch (err) {
            console.warn('Error deleting file from storage:', err);
        }
    };

    // Helper: Create thumbnail from image file
    const createThumbnail = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }

                    // Calculate thumbnail dimensions (max 400x400, maintain aspect ratio)
                    const maxSize = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create thumbnail'));
                        }
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Get photos by folder ID
    const getPhotosByFolder = (folderId: string) => {
        return photos
            .filter(p => p.folderId === folderId)
            .sort((a, b) => a.displayOrder - b.displayOrder);
    };

    // Refresh all data
    const refreshArchive = async () => {
        setLoading(true);
        await Promise.all([fetchFolders(), fetchPhotos()]);
        setLoading(false);
    };

    return (
        <ArchiveContext.Provider
            value={{
                folders,
                photos,
                loading,
                error,
                addFolder,
                updateFolder,
                deleteFolder,
                uploadPhoto,
                updatePhoto,
                deletePhoto,
                getPhotosByFolder,
                refreshArchive,
            }}
        >
            {children}
        </ArchiveContext.Provider>
    );
};

export const useArchive = () => {
    const context = useContext(ArchiveContext);
    if (!context) {
        throw new Error('useArchive must be used within an ArchiveProvider');
    }
    return context;
};
