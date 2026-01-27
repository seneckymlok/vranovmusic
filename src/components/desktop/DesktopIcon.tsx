import React from 'react';
import './DesktopIcon.css';

interface DesktopIconProps {
    id: string;
    label: string;
    icon: string;
    onClick: () => void;
    onDoubleClick: () => void;
    isSelected?: boolean;
    isMobile?: boolean;
    index?: number;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
    label,
    icon,
    onClick,
    onDoubleClick,
    isSelected = false,
    isMobile = false,
    index = 0,
}) => {
    // On mobile, single tap opens the window
    const handleClick = () => {
        onClick();
    };

    const handleDoubleClick = () => {
        if (!isMobile) {
            onDoubleClick();
        }
    };

    return (
        <button
            className={`desktop-icon ${isSelected ? 'selected' : ''} ${isMobile ? 'mobile' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onMouseDown={(e) => e.preventDefault()}
            data-index={index}
        >
            <div className="desktop-icon-image">
                <span className="desktop-icon-emoji">{icon}</span>
            </div>
            <span className="desktop-icon-label pixel-text">{label}</span>
        </button>
    );
};
