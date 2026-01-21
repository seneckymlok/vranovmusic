import React from 'react';
import { streamingLinks } from '../data/links';
import './MusicWindow.css';

export const MusicWindow: React.FC = () => {
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

            {/* Streaming Links */}
            <div className="streaming-section">
                <h3 className="section-title pixel-text">📡 STREAMING PLATFORMS</h3>
                <div className="streaming-grid">
                    {streamingLinks.map(link => (
                        <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="streaming-btn"
                            style={{ '--accent-color': link.color } as React.CSSProperties}
                        >
                            <span className="streaming-icon">{link.icon}</span>
                            <span className="streaming-name">{link.name}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Recent Release */}
            <div className="releases-section">
                <h3 className="section-title pixel-text">💿 LATEST RELEASE</h3>
                <div className="release-card">
                    <div className="release-cover">
                        <span className="cover-placeholder">VM</span>
                    </div>
                    <div className="release-info">
                        <span className="release-title pixel-text">COMING SOON</span>
                        <span className="release-type">NEW MUSIC 2026</span>
                        <span className="release-date text-gray">Stay tuned...</span>
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <div className="music-status">
                <span>{streamingLinks.length} platforms connected</span>
            </div>
        </div>
    );
};
