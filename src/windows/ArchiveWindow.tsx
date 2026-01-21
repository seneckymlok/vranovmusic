import React, { useState } from 'react';
import './ArchiveWindow.css';

type ArchiveCategory = 'photos' | 'videos' | 'flyers';

const MOCK_ITEMS = {
    photos: [
        { id: 'p1', title: 'FUGA 2025', type: 'photo' },
        { id: 'p2', title: 'TABAČKA Show', type: 'photo' },
        { id: 'p3', title: 'Studio Session', type: 'photo' },
        { id: 'p4', title: 'Backstage', type: 'photo' },
        { id: 'p5', title: 'Crew Photo', type: 'photo' },
        { id: 'p6', title: 'Prague 2024', type: 'photo' },
    ],
    videos: [
        { id: 'v1', title: 'Live Performance', type: 'video' },
        { id: 'v2', title: 'Music Video 01', type: 'video' },
        { id: 'v3', title: 'Behind The Scenes', type: 'video' },
    ],
    flyers: [
        { id: 'f1', title: 'BRATISLAVA 10.01.2026', type: 'flyer' },
        { id: 'f2', title: 'KOŠICE 27.12.2025', type: 'flyer' },
        { id: 'f3', title: 'VM LIVE', type: 'flyer' },
        { id: 'f4', title: 'SPECIAL GUEST', type: 'flyer' },
    ],
};

export const ArchiveWindow: React.FC = () => {
    const [category, setCategory] = useState<ArchiveCategory>('photos');
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const items = MOCK_ITEMS[category];

    return (
        <div className="archive-window">
            {/* Folder Navigation */}
            <div className="archive-folders">
                <button
                    className={`folder-btn ${category === 'photos' ? 'active' : ''}`}
                    onClick={() => setCategory('photos')}
                >
                    📷 PHOTOS
                </button>
                <button
                    className={`folder-btn ${category === 'videos' ? 'active' : ''}`}
                    onClick={() => setCategory('videos')}
                >
                    🎬 VIDEOS
                </button>
                <button
                    className={`folder-btn ${category === 'flyers' ? 'active' : ''}`}
                    onClick={() => setCategory('flyers')}
                >
                    🎨 FLYERS
                </button>
            </div>

            {/* Address Bar */}
            <div className="archive-address">
                <span className="address-label">Address:</span>
                <div className="address-input">
                    C:\VRANOV\ARCHIVE\{category.toUpperCase()}\
                </div>
            </div>

            {/* Content Grid */}
            <div className="archive-grid">
                {items.map(item => (
                    <button
                        key={item.id}
                        className={`archive-item ${selectedItem === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedItem(item.id)}
                        onDoubleClick={() => {
                            // Would open lightbox in full implementation
                            alert(`Opening: ${item.title}`);
                        }}
                    >
                        <div className="archive-item-preview">
                            {item.type === 'photo' && '🖼️'}
                            {item.type === 'video' && '📹'}
                            {item.type === 'flyer' && '📄'}
                        </div>
                        <span className="archive-item-title">{item.title}</span>
                    </button>
                ))}
            </div>

            {/* Status Bar */}
            <div className="archive-status">
                <span>{items.length} objects</span>
                {selectedItem && <span>1 object selected</span>}
            </div>
        </div>
    );
};
