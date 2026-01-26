import React, { useState, useEffect } from 'react';
import { Taskbar } from './Taskbar';
import { DesktopIcon } from './DesktopIcon';
import { StartMenu } from './StartMenu';
import { Window } from '../window/Window';
import { useWindowManager } from '../../hooks/useWindowManager';
import { ShowsProvider } from '../../context/ShowsContext';
import { ArchiveProvider } from '../../context/ArchiveContext';
import { AboutWindow } from '../../windows/AboutWindow';
import { MembersWindow } from '../../windows/MembersWindow';
import { ShowsWindow } from '../../windows/ShowsWindow';
import { ArchiveWindow } from '../../windows/ArchiveWindow';
import { MusicWindow } from '../../windows/MusicWindow';
import { ConnectWindow } from '../../windows/ConnectWindow';
import { AdminWindow } from '../../windows/AdminWindow';
import { GameWindow } from '../../windows/GameWindow';
import { GambleWindow } from '../../windows/GambleWindow';
import { AudioPlayer } from '../player/AudioPlayer';
import './Desktop.css';

interface DesktopIconConfig {
    id: string;
    label: string;
    icon: string;
    windowId: string;
}

const DESKTOP_ICONS: DesktopIconConfig[] = [
    { id: 'icon-vm', label: 'VM.exe', icon: '💿', windowId: 'about' },
    { id: 'icon-members', label: 'MEMBERS', icon: '👥', windowId: 'members' },
    { id: 'icon-music', label: 'MUSIC', icon: '🎵', windowId: 'music' },
    { id: 'icon-player', label: 'PLAYER.exe', icon: '🎧', windowId: 'player' },
    { id: 'icon-shows', label: 'SHOWS', icon: '🎤', windowId: 'shows' },
    { id: 'icon-archive', label: 'ARCHIVE', icon: '📁', windowId: 'archive' },
    { id: 'icon-game', label: 'VINYL SNAKE', icon: '🐍', windowId: 'game' },
    { id: 'icon-gamble', label: 'SLOTS', icon: '🎰', windowId: 'gamble' },
    { id: 'icon-connect', label: 'CONNECT', icon: '📡', windowId: 'connect' },
];

const WindowContent: React.FC<{ windowId: string }> = ({ windowId }) => {
    switch (windowId) {
        case 'about':
            return <AboutWindow />;
        case 'members':
            return <MembersWindow />;
        case 'shows':
            return <ShowsWindow />;
        case 'archive':
            return <ArchiveWindow />;
        case 'music':
            return <MusicWindow />;
        case 'connect':
            return <ConnectWindow />;
        case 'player':
            return <AudioPlayer />;
        case 'game':
            return <GameWindow />;
        case 'gamble':
            return <GambleWindow />;
        case 'admin':
            return <AdminWindow />;
        default:
            return <div className="window-content-padded">Unknown window</div>;
    }
};

export const Desktop: React.FC = () => {
    const {
        windows,
        isMobile,
        openWindow,
        closeWindow,
        minimizeWindow,
        restoreWindow,
        maximizeWindow,
        focusWindow,
        updatePosition,
        updateSize,
    } = useWindowManager();

    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

    // Listen for custom event from MusicWindow to open player
    useEffect(() => {
        const handleOpenPlayer = () => {
            openWindow('player');
        };

        window.addEventListener('openPlayerWindow', handleOpenPlayer);
        return () => {
            window.removeEventListener('openPlayerWindow', handleOpenPlayer);
        };
    }, [openWindow]);

    // Keyboard shortcut for admin panel (Ctrl+Shift+A)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                openWindow('admin');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openWindow]);

    const handleDesktopClick = (e: React.MouseEvent) => {
        // Only if clicking on the desktop itself
        if (e.target === e.currentTarget) {
            setSelectedIcon(null);
            setIsStartMenuOpen(false);
        }
    };

    // Handle icon interaction - single tap on mobile, double-click on desktop
    const handleIconInteraction = (windowId: string) => {
        openWindow(windowId);
        setIsStartMenuOpen(false);
    };

    const handleWindowClick = (id: string) => {
        const win = windows.find(w => w.id === id);
        if (win?.isMinimized) {
            restoreWindow(id);
        } else if (win?.isOpen) {
            // If already open and focused, minimize it
            minimizeWindow(id);
        } else {
            openWindow(id);
        }
    };

    const startMenuItems = DESKTOP_ICONS.map(icon => ({
        id: icon.id,
        label: icon.label,
        icon: icon.icon,
        onClick: () => handleIconInteraction(icon.windowId),
    }));

    // Get the currently active (non-minimized) window for mobile
    const activeWindow = windows.find(w => w.isOpen && !w.isMinimized);

    return (
        <ShowsProvider>
            <ArchiveProvider>
                <div className={`desktop ${isMobile ? 'mobile' : ''}`} onClick={handleDesktopClick}>
                    {/* Desktop Wallpaper - Split Black/White with Logo */}
                    <div className="desktop-wallpaper">
                        <div className="wallpaper-logo">
                            <img
                                src="/vm-logo.png"
                                alt="Vranov Music"
                                className="wallpaper-logo-image"
                            />
                            <span className="wallpaper-tagline">MIDDLE EUROPE CONTINENT .</span>
                        </div>
                    </div>

                    {/* Desktop Icons */}
                    <div className="desktop-icons">
                        {DESKTOP_ICONS.map((icon, index) => (
                            <DesktopIcon
                                key={icon.id}
                                id={icon.id}
                                label={icon.label}
                                icon={icon.icon}
                                isSelected={selectedIcon === icon.id}
                                onClick={() => {
                                    setSelectedIcon(icon.id);
                                    handleIconInteraction(icon.windowId);
                                }}
                                onDoubleClick={() => { }}
                                isMobile={isMobile}
                                index={index}
                            />
                        ))}
                    </div>

                    {/* Windows - all windows now use standard Window component */}
                    {windows.map(win => (
                        <Window
                            key={win.id}
                            window={win}
                            onClose={() => closeWindow(win.id)}
                            onMinimize={() => minimizeWindow(win.id)}
                            onMaximize={() => maximizeWindow(win.id)}
                            onFocus={() => focusWindow(win.id)}
                            onPositionChange={(pos) => updatePosition(win.id, pos)}
                            onSizeChange={(size) => updateSize(win.id, size)}
                            isMobile={isMobile}
                        >
                            <WindowContent windowId={win.id} />
                        </Window>
                    ))}

                    {/* Start Menu */}
                    <StartMenu
                        isOpen={isStartMenuOpen}
                        onClose={() => setIsStartMenuOpen(false)}
                        items={startMenuItems}
                        isMobile={isMobile}
                    />

                    {/* Taskbar */}
                    <Taskbar
                        windows={windows}
                        onWindowClick={handleWindowClick}
                        onStartClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
                        onAdminClick={() => openWindow('admin')}
                        isStartMenuOpen={isStartMenuOpen}
                        activeWindowId={activeWindow?.id}
                        isMobile={isMobile}
                    />

                    {/* CRT Overlay Effect */}
                    <div className="crt-overlay" />
                </div>
            </ArchiveProvider>
        </ShowsProvider>
    );
};
