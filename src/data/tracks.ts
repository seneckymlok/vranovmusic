/**
 * Playlist configuration for the Audio Player.
 */

export interface Track {
    url: string;
    artist: string;
    title: string;
}

export const playlist: Track[] = [
    {
        url: '/audio/krab-krab-krab.mp3',
        artist: '44LEX',
        title: 'KRAB KRAB KRAB',
    },
];

/**
 * Get all playlist tracks
 */
export const getPlaylist = () => playlist;

/**
 * Get track by index
 */
export const getTrackByIndex = (index: number) => playlist[index];
