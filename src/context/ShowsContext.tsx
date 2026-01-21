import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ShowRow } from '../lib/supabase';
import type { Show } from '../types';
import { shows as defaultShows } from '../data/shows';

interface ShowsContextType {
    shows: Show[];
    loading: boolean;
    error: string | null;
    addShow: (show: Omit<Show, 'id'>) => Promise<void>;
    updateShow: (id: string, updates: Partial<Show>) => Promise<void>;
    deleteShow: (id: string) => Promise<void>;
    getUpcomingShows: () => Show[];
    getPastShows: () => Show[];
    refreshShows: () => Promise<void>;
}

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

// Convert database row to Show type
const rowToShow = (row: ShowRow): Show => ({
    id: row.id,
    date: row.date,
    time: row.time || undefined,
    venue: row.venue,
    city: row.city,
    country: row.country,
    ticketUrl: row.ticket_url || undefined,
    flyerImage: row.flyer_image || undefined,
    description: row.description || undefined,
    isPast: row.is_past,
});

// Convert Show to database row format
const showToRow = (show: Omit<Show, 'id'>): Omit<ShowRow, 'id' | 'created_at' | 'updated_at'> => ({
    date: show.date,
    time: show.time || null,
    venue: show.venue,
    city: show.city,
    country: show.country,
    ticket_url: show.ticketUrl || null,
    flyer_image: show.flyerImage || null,
    description: show.description || null,
    is_past: show.isPast || false,
});

export const ShowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [shows, setShows] = useState<Show[]>(defaultShows);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);



    // Fetch shows from Supabase
    const fetchShows = useCallback(async () => {
        if (!isSupabaseConfigured || !supabase) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('shows')
                .select('*')
                .order('date', { ascending: true });

            if (fetchError) throw fetchError;

            if (data && data.length > 0) {
                setShows(data.map(rowToShow));
            }
        } catch (err) {
            console.error('Error fetching shows:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch shows');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchShows();
    }, [fetchShows]);

    // Real-time subscription
    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) return;

        // Capture supabase reference for cleanup
        const client = supabase;
        const channel = client
            .channel('shows_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shows' },
                () => {
                    // Refresh data on any change
                    fetchShows();
                }
            )
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, [fetchShows]);

    // Add a new show
    const addShow = async (show: Omit<Show, 'id'>) => {
        if (!isSupabaseConfigured || !supabase) {
            // Fallback to local state only
            const newShow = { ...show, id: `show-${Date.now()}` };
            setShows(prev => [...prev, newShow]);
            return;
        }

        try {
            const { error: insertError } = await supabase
                .from('shows')
                .insert(showToRow(show));

            if (insertError) throw insertError;
            // Data will refresh via subscription
        } catch (err) {
            console.error('Error adding show:', err);
            throw err;
        }
    };

    // Update an existing show
    const updateShow = async (id: string, updates: Partial<Show>) => {
        if (!isSupabaseConfigured || !supabase) {
            setShows(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            return;
        }

        try {
            const updateData: Record<string, unknown> = {};
            if (updates.date !== undefined) updateData.date = updates.date;
            if (updates.time !== undefined) updateData.time = updates.time || null;
            if (updates.venue !== undefined) updateData.venue = updates.venue;
            if (updates.city !== undefined) updateData.city = updates.city;
            if (updates.country !== undefined) updateData.country = updates.country;
            if (updates.ticketUrl !== undefined) updateData.ticket_url = updates.ticketUrl || null;
            if (updates.flyerImage !== undefined) updateData.flyer_image = updates.flyerImage || null;
            if (updates.description !== undefined) updateData.description = updates.description || null;
            if (updates.isPast !== undefined) updateData.is_past = updates.isPast;

            const { error: updateError } = await supabase
                .from('shows')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating show:', err);
            throw err;
        }
    };

    // Delete a show
    const deleteShow = async (id: string) => {
        if (!isSupabaseConfigured || !supabase) {
            setShows(prev => prev.filter(s => s.id !== id));
            return;
        }

        try {
            const { error: deleteError } = await supabase
                .from('shows')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
        } catch (err) {
            console.error('Error deleting show:', err);
            throw err;
        }
    };

    const getUpcomingShows = () => shows.filter(s => !s.isPast);
    const getPastShows = () => shows.filter(s => s.isPast);

    return (
        <ShowsContext.Provider
            value={{
                shows,
                loading,
                error,
                addShow,
                updateShow,
                deleteShow,
                getUpcomingShows,
                getPastShows,
                refreshShows: fetchShows,
            }}
        >
            {children}
        </ShowsContext.Provider>
    );
};

export const useShows = () => {
    const context = useContext(ShowsContext);
    if (!context) {
        throw new Error('useShows must be used within a ShowsProvider');
    }
    return context;
};
