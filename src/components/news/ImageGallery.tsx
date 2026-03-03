import React, { useState } from 'react';
import './ImageGallery.css';

interface ImageGalleryProps {
    images: string[]; // Array of image URLs
    altText?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, altText = 'News Image' }) => {
    // Filter out undefined/null/empty strings just in case
    const validImages = images.filter(url => url && url.length > 0);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (validImages.length === 0) return null;

    // Single Image Mode
    if (validImages.length === 1) {
        return (
            <div className="news-image-container">
                <img
                    src={validImages[0]}
                    alt={altText}
                    className="news-image"
                    loading="lazy"
                />
            </div>
        );
    }

    // Multi Image Mode
    const handlePrev = () => {
        setCurrentIndex(prev => (prev === 0 ? validImages.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev === validImages.length - 1 ? 0 : prev + 1));
    };

    // Touch Handling for Swipe
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        }
        if (isRightSwipe) {
            handlePrev();
        }
    };

    return (
        <div
            className="image-gallery"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="gallery-main-view">
                <img
                    src={validImages[currentIndex]}
                    alt={`${altText} ${currentIndex + 1}`}
                    className="gallery-image"
                />
            </div>

            <div className="gallery-controls">
                <button
                    className="btn-98 gallery-btn"
                    onClick={handlePrev}
                    title="Previous Photo"
                >
                    &lt;
                </button>

                <div className="gallery-counter">
                    {currentIndex + 1} / {validImages.length}
                </div>

                <button
                    className="btn-98 gallery-btn"
                    onClick={handleNext}
                    title="Next Photo"
                >
                    &gt;
                </button>
            </div>
        </div>
    );
};
