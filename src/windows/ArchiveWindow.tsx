import React, { useState } from 'react';
import './ArchiveWindow.css';

type ArchiveCategory = 'photos' | 'videos' | 'flyers';

const ARCHIVE_ITEMS: Record<ArchiveCategory, { id: string; title: string; type: string }[]> = {
    photos: [],
    videos: [],
    flyers: [],
};

export const ArchiveWindow: React.FC = () => {
    const [category, setCategory] = useState<ArchiveCategory>('photos');

    const items = ARCHIVE_ITEMS[category];

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
                {items.length === 0 ? (
                    <div className="archive-empty">
                        <span className="pixel-text text-gray">No items yet.</span>
                    </div>
                ) : (
                    items.map(item => (
                        <button
                            key={item.id}
                            className="archive-item"
                        >
                            <div className="archive-item-preview">
                                {item.type === 'photo' && '🖼️'}
                                {item.type === 'video' && '📹'}
                                {item.type === 'flyer' && '📄'}
                            </div>
                            <span className="archive-item-title">{item.title}</span>
                        </button>
                    ))
                )}
            </div>

            {/* Status Bar */}
            <div className="archive-status">
                <span>{items.length} objects</span>
            </div>
        </div>
    );
};
