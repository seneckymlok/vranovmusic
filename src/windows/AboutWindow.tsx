import React from 'react';
import './AboutWindow.css';

export const AboutWindow: React.FC = () => {
    return (
        <div className="about-window">
            <div className="about-header">
                <div className="about-logo">
                    <img
                        src="/vm-logo.png"
                        alt="Vranov Music Logo"
                        className="about-logo-image"
                    />
                </div>
            </div>

            <div className="about-content">
                <h1 className="about-title pixel-text">VRANOV MUSIC</h1>
                <p className="about-subtitle">UNDERGROUND COLLECTIVE</p>
                <p className="about-tagline">MIDDLE EUROPE CONTINENT</p>

                <div className="about-divider" />

                <p className="about-description">
                    Vranov Music is an underground music collective from Slovakia,
                    bringing raw energy and authentic sound from the heart of Middle Europe.
                </p>

                <div className="about-stats">
                    <div className="stat">
                        <span className="stat-value text-green">7</span>
                        <span className="stat-label">MEMBERS</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value text-red">2024</span>
                        <span className="stat-label">ESTABLISHED</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value text-gold">SK/CZ</span>
                        <span className="stat-label">BASED</span>
                    </div>
                </div>

                <div className="about-silhouettes">
                    <img
                        src="/silhouettes.png"
                        alt="Vranov Music Collective"
                        className="silhouettes-image"
                    />
                </div>
            </div>

            <div className="about-footer">
                <span className="mono-text">info@vranovmusic.eu</span>
            </div>
        </div>
    );
};
