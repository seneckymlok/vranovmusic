import React from 'react';
import './StartMenu.css';

interface StartMenuItem {
    id: string;
    label: string;
    icon: string;
    onClick: () => void;
}

interface StartMenuProps {
    isOpen: boolean;
    onClose: () => void;
    items: StartMenuItem[];
    isMobile?: boolean;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, items, isMobile = false }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop to close menu */}
            <div className="start-menu-backdrop" onClick={onClose} />

            <div className={`start-menu ${isMobile ? 'mobile' : ''}`}>
                {/* Side Banner */}
                <div className="start-menu-banner">
                    <span className="banner-text pixel-text">VRANOV<br />MUSIC<br />OS</span>
                </div>

                {/* Menu Items */}
                <div className="start-menu-items">
                    {/* Close button on mobile */}
                    {isMobile && (
                        <button className="start-menu-close" onClick={onClose}>
                            <span>×</span>
                        </button>
                    )}

                    {items.map(item => (
                        <button
                            key={item.id}
                            className="start-menu-item"
                            onClick={() => {
                                item.onClick();
                                onClose();
                            }}
                        >
                            <span className="start-menu-item-icon">{item.icon}</span>
                            <span className="start-menu-item-label">{item.label}</span>
                        </button>
                    ))}

                    {/* Divider */}
                    <div className="start-menu-divider" />

                    {/* Shutdown option (just for fun) */}
                    <button className="start-menu-item shutdown">
                        <span className="start-menu-item-icon">⏻</span>
                        <span className="start-menu-item-label">Shut Down...</span>
                    </button>
                </div>
            </div>
        </>
    );
};
