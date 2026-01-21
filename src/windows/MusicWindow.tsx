import React, { useState } from 'react';
import './MusicWindow.css';

interface Artist {
    id: string;
    name: string;
    spotify: string;
    appleMusic: string;
}

const ARTISTS: Artist[] = [
    {
        id: '44lex',
        name: '44LEX',
        spotify: 'https://open.spotify.com/artist/5iZTYBhlfr88ZIwTYCZgdb',
        appleMusic: 'https://music.apple.com/sk/artist/44lex/1652573906',
    },
    {
        id: 'sushislime',
        name: 'SUSHISLIME',
        spotify: 'https://open.spotify.com/artist/6gzOCUTX3igvLapUbJinDh',
        appleMusic: 'https://music.apple.com/sk/artist/sushislime/1738278360',
    },
    {
        id: 'pudge',
        name: 'PUDGE',
        spotify: 'https://open.spotify.com/artist/5hA4e3qNO5vbDnG0t6okYM',
        appleMusic: 'https://music.apple.com/sk/artist/pudge/1471355405',
    },
];

export const MusicWindow: React.FC = () => {
    const [selectedArtist, setSelectedArtist] = useState<Artist>(ARTISTS[0]);

    // Function to open the Webamp player
    const handleLaunchPlayer = () => {
        // Dispatch custom event to open player window
        window.dispatchEvent(new CustomEvent('openPlayerWindow'));
    };

    return (
        <div className="music-window">
            {/* Player Header - Launch Button */}
            <div className="music-player">
                <div className="player-display">
                    <div className="player-visualizer">
                        {[...Array(16)].map((_, i) => (
                            <div
                                key={i}
                                className="visualizer-bar"
                                style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.05}s`,
                                }}
                            />
                        ))}
                    </div>
                    <div className="player-info">
                        <span className="player-title pixel-text">VRANOV MUSIC</span>
                        <span className="player-subtitle text-gray">Native Player</span>
                    </div>
                </div>
                <div className="player-launch">
                    <button
                        className="launch-player-btn btn-98 btn-98-primary"
                        onClick={handleLaunchPlayer}
                    >
                        🎧 LAUNCH PLAYER
                    </button>
                    <span className="launch-hint text-gray">Open WinAMP-style player</span>
                </div>
            </div>

            {/* Artist Selection */}
            <div className="artist-section">
                <h3 className="section-title pixel-text">🎤 SELECT ARTIST</h3>
                <div className="artist-tabs">
                    {ARTISTS.map(artist => (
                        <button
                            key={artist.id}
                            className={`artist-tab ${selectedArtist.id === artist.id ? 'active' : ''}`}
                            onClick={() => setSelectedArtist(artist)}
                        >
                            <span className="pixel-text">{artist.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Streaming Links for Selected Artist */}
            <div className="streaming-section">
                <h3 className="section-title pixel-text">📡 LISTEN TO {selectedArtist.name}</h3>
                <div className="streaming-grid">
                    <a
                        href={selectedArtist.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="streaming-btn spotify"
                    >
                        <span className="streaming-icon">🎵</span>
                        <span className="streaming-name">Spotify</span>
                    </a>
                    <a
                        href={selectedArtist.appleMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="streaming-btn apple"
                    >
                        <span className="streaming-icon">🍎</span>
                        <span className="streaming-name">Apple Music</span>
                    </a>
                </div>
            </div>

            {/* Status bar */}
            <div className="music-status">
                <span>Listening to {selectedArtist.name}</span>
            </div>
        </div>
    );
};
