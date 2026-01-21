import { useState, useCallback, useRef, useEffect } from 'react';

export type ResizeDirection =
    | 'n' | 's' | 'e' | 'w'
    | 'ne' | 'nw' | 'se' | 'sw';

interface UseResizableOptions {
    initialSize: { width: number; height: number };
    minSize?: { width: number; height: number };
    maxSize?: { width: number; height: number };
    onResizeEnd?: (size: { width: number; height: number }) => void;
    onPositionChange?: (position: { x: number; y: number }) => void;
    position?: { x: number; y: number };
}

interface UseResizableReturn {
    size: { width: number; height: number };
    position: { x: number; y: number };
    isResizing: boolean;
    resizeDirection: ResizeDirection | null;
    handleResizeStart: (direction: ResizeDirection) => (e: React.MouseEvent | React.TouchEvent) => void;
}

export function useResizable({
    initialSize,
    minSize = { width: 200, height: 150 },
    maxSize = { width: 1920, height: 1080 },
    onResizeEnd,
    onPositionChange,
    position: externalPosition,
}: UseResizableOptions): UseResizableReturn {
    const [size, setSize] = useState(initialSize);
    const [position, setPosition] = useState(externalPosition || { x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);

    const startSize = useRef(initialSize);
    const startPosition = useRef({ x: 0, y: 0 });
    const startMouse = useRef({ x: 0, y: 0 });

    // Sync with external position
    useEffect(() => {
        if (externalPosition) {
            setPosition(externalPosition);
        }
    }, [externalPosition]);

    // Sync with initialSize changes (e.g., window state updates)
    useEffect(() => {
        setSize(initialSize);
    }, [initialSize]);

    const handleResizeStart = useCallback((direction: ResizeDirection) => {
        return (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            setIsResizing(true);
            setResizeDirection(direction);
            startSize.current = { ...size };
            startPosition.current = { ...position };
            startMouse.current = { x: clientX, y: clientY };
        };
    }, [size, position]);

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isResizing || !resizeDirection) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - startMouse.current.x;
        const deltaY = clientY - startMouse.current.y;

        let newWidth = startSize.current.width;
        let newHeight = startSize.current.height;
        let newX = startPosition.current.x;
        let newY = startPosition.current.y;

        // Calculate new dimensions based on resize direction
        if (resizeDirection.includes('e')) {
            newWidth = Math.min(maxSize.width, Math.max(minSize.width, startSize.current.width + deltaX));
        }
        if (resizeDirection.includes('w')) {
            const widthChange = Math.min(
                startSize.current.width - minSize.width,
                Math.max(-(maxSize.width - startSize.current.width), deltaX)
            );
            newWidth = Math.max(minSize.width, startSize.current.width - widthChange);
            newX = startPosition.current.x + (startSize.current.width - newWidth);
        }
        if (resizeDirection.includes('s')) {
            newHeight = Math.min(maxSize.height, Math.max(minSize.height, startSize.current.height + deltaY));
        }
        if (resizeDirection.includes('n')) {
            const heightChange = Math.min(
                startSize.current.height - minSize.height,
                Math.max(-(maxSize.height - startSize.current.height), deltaY)
            );
            newHeight = Math.max(minSize.height, startSize.current.height - heightChange);
            newY = startPosition.current.y + (startSize.current.height - newHeight);
        }

        setSize({ width: newWidth, height: newHeight });

        // Only update position if resizing from top or left edges
        if (resizeDirection.includes('n') || resizeDirection.includes('w')) {
            setPosition({ x: newX, y: newY });
        }
    }, [isResizing, resizeDirection, minSize, maxSize]);

    const handleMouseUp = useCallback(() => {
        if (isResizing) {
            setIsResizing(false);
            setResizeDirection(null);

            if (onResizeEnd) {
                onResizeEnd(size);
            }
            if (onPositionChange && (resizeDirection?.includes('n') || resizeDirection?.includes('w'))) {
                onPositionChange(position);
            }
        }
    }, [isResizing, size, position, onResizeEnd, onPositionChange, resizeDirection]);

    // Add/remove global event listeners
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchmove', handleMouseMove);
                window.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return {
        size,
        position,
        isResizing,
        resizeDirection,
        handleResizeStart,
    };
}
