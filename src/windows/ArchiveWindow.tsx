import React, { useState } from 'react';
import { useArchive } from '../context/ArchiveContext';
import './ArchiveWindow.css';

type ArchiveCategory = 'photos' | 'videos' | 'flyers';

export const ArchiveWindow: React.FC = () => {
    const { folders, getPhotosByFolder, loading } = useArchive();
    const [category, setCategory] = useState<ArchiveCategory>('photos');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null);

    const categoryFolders = folders.filter(f => f.category === category);
    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    const folderPhotos = selectedFolderId ? getPhotosByFolder(selectedFolderId) : [];

    const handleFolderClick = (folderId: string) => {
        setSelectedFolderId(folderId);
    };

    const handleBackToFolders = () => {
        setSelectedFolderId(null);
    };

    const handlePhotoClick = (index: number) => {
        setLightboxPhotoIndex(index);
    };

    const handleCloseLightbox = () => {
        setLightboxPhotoIndex(null);
    };

    const handlePreviousPhoto = () => {
        if (lightboxPhotoIndex !== null && lightboxPhotoIndex > 0) {
            setLightboxPhotoIndex(lightboxPhotoIndex - 1);
        }
    };

    const handleNextPhoto = () => {
        if (lightboxPhotoIndex !== null && lightboxPhotoIndex < folderPhotos.length - 1) {
            setLightboxPhotoIndex(lightboxPhotoIndex + 1);
        }
    };

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxPhotoIndex === null) return;

            switch (e.key) {
                case 'Escape':
                    handleCloseLightbox();
                    break;
                case 'ArrowLeft':
                    handlePreviousPhoto();
                    break;
                case 'ArrowRight':
                    handleNextPhoto();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxPhotoIndex, folderPhotos.length]);

    // Folder view
    if (!selectedFolderId) {
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
                        C:\\VRANOV\\ARCHIVE\\{category.toUpperCase()}\\
                    </div>
                </div>

                {/* Content Grid */}
                <div className="archive-grid">
                    {loading ? (
                        <div className="archive-empty">
                            <span className="pixel-text text-gray">⏳ Loading...</span>
                        </div>
                    ) : categoryFolders.length === 0 ? (
                        <div className="archive-empty">
                            <span className="pixel-text text-gray">No folders yet.</span>
                        </div>
                    ) : (
                        categoryFolders.map(folder => {
                            const photoCount = getPhotosByFolder(folder.id).length;
                            const previewPhoto = getPhotosByFolder(folder.id)[0];

                            return (
                                <button
                                    key={folder.id}
                                    className="archive-item"
                                    onClick={() => handleFolderClick(folder.id)}
                                >
                                    <div className="archive-item-preview">
                                        {previewPhoto?.thumbnailUrl ? (
                                            <img src={previewPhoto.thumbnailUrl} alt={folder.name} />
                                        ) : (
                                            <div className="archive-item-icon">
                                                {folder.category === 'photos' && '📷'}
                                                {folder.category === 'videos' && '🎬'}
                                                {folder.category === 'flyers' && '🎨'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="archive-item-title">{folder.name}</span>
                                    <span className="archive-item-count">{photoCount} items</span>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Status Bar */}
                <div className="archive-status">
                    <span>{categoryFolders.length} folders</span>
                </div>
            </div>
        );
    }

    // Gallery view
    const currentPhoto = lightboxPhotoIndex !== null ? folderPhotos[lightboxPhotoIndex] : null;

    return (
        <div className="archive-window">
            {/* Navigation */}
            <div className="archive-folders">
                <button className="folder-btn" onClick={handleBackToFolders}>
                    ⬅️ BACK
                </button>
                <span className="archive-breadcrumb">
                    {category.toUpperCase()} / {selectedFolder?.name}
                </span>
            </div>

            {/* Address Bar */}
            <div className="archive-address">
                <span className="address-label">Address:</span>
                <div className="address-input">
                    C:\\VRANOV\\ARCHIVE\\{category.toUpperCase()}\\{selectedFolder?.name}\\
                </div>
            </div>

            {/* Photo Gallery */}
            <div className="archive-gallery">
                {loading ? (
                    <div className="archive-empty">
                        <span className="pixel-text text-gray">⏳ Loading...</span>
                    </div>
                ) : folderPhotos.length === 0 ? (
                    <div className="archive-empty">
                        <span className="pixel-text text-gray">No photos in this folder.</span>
                    </div>
                ) : (
                    folderPhotos.map((photo, index) => (
                        <div
                            key={photo.id}
                            className="gallery-item"
                            onClick={() => handlePhotoClick(index)}
                        >
                            <img
                                src={photo.thumbnailUrl || photo.url}
                                alt={photo.title}
                                className="gallery-image"
                            />
                            <div className="gallery-item-overlay">
                                <span>{photo.title}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Status Bar */}
            <div className="archive-status">
                <span>{folderPhotos.length} photos</span>
            </div>

            {/* Lightbox */}
            {currentPhoto && lightboxPhotoIndex !== null && (
                <div className="lightbox" onClick={handleCloseLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={handleCloseLightbox}>
                            ✖️
                        </button>

                        <div className="lightbox-image-container">
                            {lightboxPhotoIndex > 0 && (
                                <button className="lightbox-nav lightbox-prev" onClick={handlePreviousPhoto}>
                                    ◀️
                                </button>
                            )}

                            <img
                                src={currentPhoto.url}
                                alt={currentPhoto.title}
                                className="lightbox-image"
                            />

                            {lightboxPhotoIndex < folderPhotos.length - 1 && (
                                <button className="lightbox-nav lightbox-next" onClick={handleNextPhoto}>
                                    ▶️
                                </button>
                            )}
                        </div>

                        <div className="lightbox-info">
                            <h3 className="pixel-text">{currentPhoto.title}</h3>
                            {currentPhoto.description && (
                                <p className="lightbox-description">{currentPhoto.description}</p>
                            )}
                            {currentPhoto.photoDate && (
                                <p className="lightbox-date">
                                    📅 {new Date(currentPhoto.photoDate).toLocaleDateString()}
                                </p>
                            )}
                            <p className="lightbox-counter">
                                {lightboxPhotoIndex + 1} / {folderPhotos.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
