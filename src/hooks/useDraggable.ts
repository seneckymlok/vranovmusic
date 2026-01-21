import { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableOptions {
    initialPosition: { x: number; y: number };
    bounds?: { left: number; top: number; right: number; bottom: number };
    handle?: string; // CSS selector for drag handle
    disabled?: boolean;
    onDragStart?: () => void;
    onDragEnd?: (position: { x: number; y: number }) => void;
}

export function useDraggable(options: DraggableOptions) {
    const {
        initialPosition,
        bounds,
        disabled = false,
        onDragStart,
        onDragEnd,
    } = options;

    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Update position when initialPosition changes externally
    useEffect(() => {
        setPosition(initialPosition);
    }, [initialPosition.x, initialPosition.y]);

    // Unified handler to start dragging (mouse or touch)
    const startDrag = useCallback((clientX: number, clientY: number) => {
        if (disabled) return false;

        setIsDragging(true);
        onDragStart?.();

        const rect = elementRef.current?.getBoundingClientRect();
        if (rect) {
            dragOffset.current = {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        }
        return true;
    }, [disabled, onDragStart]);

    // Mouse down handler
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Check if we're clicking inside the content area (not title bar)
        const target = e.target as HTMLElement;
        if (target.closest('.window-content') || target.closest('.window-controls')) {
            return;
        }

        e.preventDefault();
        startDrag(e.clientX, e.clientY);
    }, [startDrag]);

    // Touch start handler
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Check if we're touching inside the content area (not title bar)
        const target = e.target as HTMLElement;
        if (target.closest('.window-content') || target.closest('.window-controls')) {
            return;
        }

        const touch = e.touches[0];
        if (touch && startDrag(touch.clientX, touch.clientY)) {
            // Prevent scrolling while dragging
            e.preventDefault();
        }
    }, [startDrag]);

    // Unified move handler
    const updatePosition = useCallback((clientX: number, clientY: number) => {
        let newX = clientX - dragOffset.current.x;
        let newY = clientY - dragOffset.current.y;

        // Apply bounds if specified
        if (bounds) {
            newX = Math.max(bounds.left, Math.min(newX, bounds.right));
            newY = Math.max(bounds.top, Math.min(newY, bounds.bottom));
        }

        // Prevent dragging off screen
        newX = Math.max(-100, newX);
        newY = Math.max(0, newY);

        setPosition({ x: newX, y: newY });
    }, [bounds]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        updatePosition(e.clientX, e.clientY);
    }, [isDragging, updatePosition]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        if (touch) {
            updatePosition(touch.clientX, touch.clientY);
        }
        // Prevent scrolling while dragging
        e.preventDefault();
    }, [isDragging, updatePosition]);

    const handleDragEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            onDragEnd?.(position);
        }
    }, [isDragging, onDragEnd, position]);

    useEffect(() => {
        if (isDragging) {
            // Mouse events
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleDragEnd);
            // Touch events
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
            document.addEventListener('touchcancel', handleDragEnd);
            // Visual feedback
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.removeEventListener('touchcancel', handleDragEnd);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd]);

    return {
        position,
        isDragging,
        elementRef,
        handleMouseDown,
        handleTouchStart,
        setPosition,
    };
}
