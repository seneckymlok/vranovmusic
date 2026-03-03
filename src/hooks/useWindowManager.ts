import { useState, useCallback, useEffect } from 'react';
import type { WindowState } from '../types';

interface WindowConfig {
    id: string;
    title: string;
    icon: string;
    defaultSize: { width: number; height: number };
}

const INITIAL_WINDOWS: WindowConfig[] = [
    { id: 'about', title: 'VM.exe', icon: '💿', defaultSize: { width: 500, height: 400 } },
    { id: 'members', title: 'MEMBERS.exe', icon: '👥', defaultSize: { width: 600, height: 500 } },
    { id: 'shows', title: 'SHOWS.exe', icon: '🎤', defaultSize: { width: 550, height: 450 } },
    { id: 'archive', title: 'ARCHIVE.exe', icon: '📁', defaultSize: { width: 650, height: 500 } },
    { id: 'music', title: 'MUSIC.exe', icon: '🎵', defaultSize: { width: 450, height: 400 } },
    { id: 'game', title: 'VINYL SNAKE.exe', icon: '🐍', defaultSize: { width: 500, height: 600 } },
    { id: 'gamble', title: 'SLOTS.exe', icon: '🎰', defaultSize: { width: 450, height: 600 } },
    { id: 'player', title: 'PLAYER.exe', icon: '🎧', defaultSize: { width: 550, height: 400 } },
    { id: 'connect', title: 'CONNECT.exe', icon: '📡', defaultSize: { width: 400, height: 450 } },
    { id: 'news', title: 'NEWS.exe', icon: '📰', defaultSize: { width: 550, height: 650 } },
    { id: 'admin', title: 'ADMIN.exe', icon: '⚙️', defaultSize: { width: 700, height: 550 } },
];

// Mobile detection hook
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' && window.innerWidth < 768
    );

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

// Get responsive window size based on screen
const getResponsiveSize = (defaultSize: { width: number; height: number }, isMobile: boolean) => {
    if (!isMobile) return defaultSize;

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 667;

    return {
        width: Math.min(defaultSize.width, viewportWidth - 16), // 8px margin on each side
        height: Math.min(defaultSize.height, viewportHeight - 80), // Account for taskbar + some padding
    };
};

// Get responsive position
const getResponsivePosition = (index: number, size: { width: number; height: number }, isMobile: boolean) => {
    if (!isMobile) {
        return {
            x: 80 + (index % 3) * 50,
            y: 60 + Math.floor(index / 3) * 40,
        };
    }

    // Center windows on mobile, slightly staggered
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    return {
        x: Math.max(8, (viewportWidth - size.width) / 2),
        y: 20 + (index % 2) * 20, // Slight stagger
    };
};

export function useWindowManager() {
    const isMobile = useIsMobile();

    const [windows, setWindows] = useState<WindowState[]>(() =>
        INITIAL_WINDOWS.map((config, index) => {
            const size = getResponsiveSize(config.defaultSize, isMobile);
            return {
                ...config,
                isOpen: false,
                isMinimized: false,
                isMaximized: false,
                zIndex: 10 + index,
                position: getResponsivePosition(index, size, isMobile),
                size,
            };
        })
    );

    const [highestZ, setHighestZ] = useState(20);

    // Update window sizes on viewport resize
    useEffect(() => {
        setWindows(prev => prev.map((w, index) => {
            const newSize = getResponsiveSize(w.defaultSize, isMobile);
            const newPosition = w.isOpen ? w.position : getResponsivePosition(index, newSize, isMobile);
            return {
                ...w,
                size: w.isMaximized ? w.size : newSize,
                position: w.isMaximized ? w.position : newPosition,
            };
        }));
    }, [isMobile]);

    const openWindow = useCallback((id: string) => {
        setWindows(prev => prev.map((w, index) => {
            if (w.id === id) {
                const newZ = highestZ + 1;
                setHighestZ(newZ);
                const size = getResponsiveSize(w.defaultSize, isMobile);
                return {
                    ...w,
                    isOpen: true,
                    isMinimized: false,
                    // Auto-maximize on mobile for better UX
                    isMaximized: isMobile,
                    zIndex: newZ,
                    size,
                    position: getResponsivePosition(index, size, isMobile),
                };
            }
            return w;
        }));
    }, [highestZ, isMobile]);

    const closeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isOpen: false, isMaximized: false } : w
        ));
    }, []);

    const minimizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMinimized: true } : w
        ));
    }, []);

    const restoreWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                const newZ = highestZ + 1;
                setHighestZ(newZ);
                return { ...w, isMinimized: false, zIndex: newZ };
            }
            return w;
        }));
    }, [highestZ]);

    const maximizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
        ));
    }, []);

    const focusWindow = useCallback((id: string) => {
        setWindows(prev => {
            const newZ = highestZ + 1;
            setHighestZ(newZ);
            return prev.map(w =>
                w.id === id ? { ...w, zIndex: newZ } : w
            );
        });
    }, [highestZ]);

    const updatePosition = useCallback((id: string, position: { x: number; y: number }) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, position } : w
        ));
    }, []);

    const updateSize = useCallback((id: string, size: { width: number; height: number }) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, size } : w
        ));
    }, []);

    const getOpenWindows = useCallback(() =>
        windows.filter(w => w.isOpen), [windows]);

    const getWindowById = useCallback((id: string) =>
        windows.find(w => w.id === id), [windows]);

    return {
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
        getOpenWindows,
        getWindowById,
    };
}
