import React, { useState, useRef, useEffect } from 'react';
import { playlist, type Track } from '../../data/tracks';
import './AudioPlayer.css';

export const AudioPlayer: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);

    const currentTrack: Track = playlist[currentTrackIndex];

    // Update time display
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration || 0);
        const handleEnded = () => {
            if (currentTrackIndex < playlist.length - 1) {
                setCurrentTrackIndex(prev => prev + 1);
            } else {
                setCurrentTrackIndex(0);
                setIsPlaying(false);
            }
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentTrackIndex]);

    // Handle track change
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.load();
        if (isPlaying) {
            audio.play().catch(console.error);
        }
    }, [currentTrackIndex]);

    // Handle volume changes
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    };

    const handlePrev = () => {
        if (currentTime > 3 || currentTrackIndex === 0) {
            if (audioRef.current) audioRef.current.currentTime = 0;
        } else {
            setCurrentTrackIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(prev => prev + 1);
        } else {
            setCurrentTrackIndex(0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = Number(e.target.value);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(e.target.value));
        if (isMuted) setIsMuted(false);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const formatTime = (time: number) => {
        if (!isFinite(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="audio-player">
            <audio ref={audioRef} src={currentTrack.url} preload="metadata" />

            {/* Display Panel - LCD Style */}
            <div className="player-lcd">
                <div className="lcd-visualizer">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className={`viz-bar ${isPlaying ? 'playing' : ''}`}
                            style={{ animationDelay: `${i * 0.08}s` }}
                        />
                    ))}
                </div>
                <div className="lcd-info">
                    <div className="lcd-track">
                        <span className="lcd-artist">{currentTrack.artist}</span>
                        <span className="lcd-title">{currentTrack.title}</span>
                    </div>
                    <div className="lcd-time">
                        <span className="time-current">{formatTime(currentTime)}</span>
                        <span className="time-separator">/</span>
                        <span className="time-total">{formatTime(duration)}</span>
                    </div>
                </div>
                <div className="lcd-status">
                    {isPlaying ? '▶ PLAYING' : '■ STOPPED'}
                </div>
            </div>

            {/* Progress Bar - Windows 98 Style */}
            <div className="player-seek">
                <div className="seek-track">
                    <div
                        className="seek-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                    <input
                        type="range"
                        className="seek-input"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                    />
                </div>
            </div>

            {/* Transport Controls */}
            <div className="player-transport">
                <button className="btn-98 transport-btn" onClick={handlePrev} title="Previous / Restart">
                    ⏮
                </button>
                <button
                    className={`btn-98 transport-btn play-btn ${isPlaying ? 'active' : ''}`}
                    onClick={togglePlay}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <button className="btn-98 transport-btn" onClick={handleNext} title="Next">
                    ⏭
                </button>

                <div className="volume-group">
                    <button className="btn-98 volume-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                    </button>
                    <div className="volume-track">
                        <div
                            className="volume-fill"
                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                        <input
                            type="range"
                            className="volume-input"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                        />
                    </div>
                </div>
            </div>

            {/* Track Info Footer */}
            <div className="player-footer">
                <span className="footer-label pixel-text">NOW PLAYING</span>
                <span className="footer-track pixel-text">{currentTrack.artist} - {currentTrack.title}</span>
            </div>
        </div>
    );
};
