import React, { useState, useEffect } from 'react';
import type { WindowState } from '../../types';
import { socialLinks } from '../../data/links';
import './Taskbar.css';

interface TaskbarProps {
    windows: WindowState[];
    onWindowClick: (id: string) => void;
    onStartClick: () => void;
    onAdminClick?: () => void;
    isStartMenuOpen: boolean;
    activeWindowId?: string;
    isMobile?: boolean;
}

export const Taskbar: React.FC<TaskbarProps> = ({
    windows,
    onWindowClick,
    onStartClick,
    onAdminClick,
    isStartMenuOpen,
    activeWindowId,
    isMobile = false,
}) => {
    const [time, setTime] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('sk-SK', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openWindows = windows.filter(w => w.isOpen);

    return (
        <div className={`taskbar ${isMobile ? 'mobile' : ''}`}>
            {/* Start Button */}
            <button
                className={`start-button ${isStartMenuOpen ? 'active' : ''}`}
                onClick={onStartClick}
            >
                <span className="start-icon">💿</span>
                <span className="start-text pixel-text">VM</span>
            </button>

            {/* Quick Launch Divider */}
            <div className="taskbar-divider" />

            {/* Open Windows */}
            <div className="taskbar-windows">
                {openWindows.map(win => (
                    <button
                        key={win.id}
                        className={`taskbar-window-btn ${win.isMinimized ? 'minimized' : ''} ${activeWindowId === win.id ? 'current' : ''}`}
                        onClick={() => onWindowClick(win.id)}
                    >
                        <span className="taskbar-window-icon">{win.icon}</span>
                        <span className="taskbar-window-title">{win.title}</span>
                        {/* Active indicator dot on mobile */}
                        {isMobile && activeWindowId === win.id && !win.isMinimized && (
                            <span className="taskbar-active-dot" />
                        )}
                    </button>
                ))}
            </div>

            {/* System Tray */}
            <div className="system-tray">
                {/* Admin Button */}
                {onAdminClick && (
                    <button
                        className="tray-admin-btn"
                        onClick={onAdminClick}
                        title="Admin Panel"
                    >
                        ⚙️
                    </button>
                )}
                {!isMobile && (
                    <div className="tray-icons">
                        {socialLinks.slice(0, 3).map(link => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tray-icon"
                                title={link.name}
                            >
                                {link.icon}
                            </a>
                        ))}
                    </div>
                )}
                {!isMobile && <div className="taskbar-divider" />}
                <div className="tray-clock pixel-text">
                    {formatTime(time)}
                </div>
            </div>
        </div>
    );
};
