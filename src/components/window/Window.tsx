import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable, type ResizeDirection } from '../../hooks/useResizable';
import type { WindowState } from '../../types';
import './Window.css';

interface WindowProps {
    window: WindowState;
    children: React.ReactNode;
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
    onFocus: () => void;
    onPositionChange: (position: { x: number; y: number }) => void;
    onSizeChange?: (size: { width: number; height: number }) => void;
    isMobile?: boolean;
}

// Resize handle directions
const RESIZE_HANDLES: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export const Window: React.FC<WindowProps> = ({
    window: win,
    children,
    onClose,
    onMinimize,
    onMaximize,
    onFocus,
    onPositionChange,
    onSizeChange,
    isMobile = false,
}) => {
    const { position: dragPosition, isDragging, elementRef, handleMouseDown, handleTouchStart } = useDraggable({
        initialPosition: win.position,
        onDragEnd: onPositionChange,
    });

    // Resizable hook
    const {
        size: resizeSize,
        position: resizePosition,
        isResizing,
        handleResizeStart,
    } = useResizable({
        initialSize: win.size,
        minSize: { width: 280, height: 200 },
        maxSize: { width: 1600, height: 1000 },
        position: win.position,
        onResizeEnd: (newSize) => {
            if (onSizeChange) {
                onSizeChange(newSize);
            }
        },
        onPositionChange: (newPos) => {
            onPositionChange(newPos);
        },
    });

    // Use resize position when resizing, otherwise drag position
    const currentPosition = isResizing ? resizePosition : dragPosition;
    const currentSize = isResizing ? resizeSize : win.size;

    // Mobile swipe-to-minimize state
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwipeActive, setIsSwipeActive] = useState(false);
    const swipeStartY = useRef(0);
    const titleBarRef = useRef<HTMLDivElement>(null);

    // Animation state for enter/exit
    const [animationState, setAnimationState] = useState<'entering' | 'visible' | 'exiting'>('entering');

    // Enter animation on mount
    useEffect(() => {
        if (win.isOpen && !win.isMinimized) {
            setAnimationState('entering');
            const timer = setTimeout(() => setAnimationState('visible'), 250);
            return () => clearTimeout(timer);
        }
    }, [win.isOpen, win.isMinimized]);

    // Mobile swipe-to-minimize handlers
    const handleSwipeStart = useCallback((clientY: number) => {
        if (!isMobile) return;
        swipeStartY.current = clientY;
        setIsSwipeActive(true);
    }, [isMobile]);

    const handleSwipeMove = useCallback((clientY: number) => {
        if (!isMobile || !isSwipeActive) return;
        const delta = clientY - swipeStartY.current;
        if (delta > 0) {
            setSwipeOffset(Math.min(delta, 150));
        }
    }, [isMobile, isSwipeActive]);

    const handleSwipeEnd = useCallback(() => {
        if (!isMobile) return;
        setIsSwipeActive(false);

        if (swipeOffset > 80) {
            setAnimationState('exiting');
            setTimeout(() => {
                onMinimize();
                setSwipeOffset(0);
            }, 200);
        } else {
            setSwipeOffset(0);
        }
    }, [isMobile, swipeOffset, onMinimize]);

    // Touch event handlers for title bar
    const handleTitleBarTouchStart = (e: React.TouchEvent) => {
        if (isMobile) {
            handleSwipeStart(e.touches[0].clientY);
        } else {
            handleTouchStart(e);
        }
        onFocus();
    };

    const handleTitleBarTouchMove = (e: React.TouchEvent) => {
        if (isMobile && isSwipeActive) {
            handleSwipeMove(e.touches[0].clientY);
        }
    };

    const handleTitleBarTouchEnd = () => {
        if (isMobile) {
            handleSwipeEnd();
        }
    };

    if (!win.isOpen) return null;
    if (win.isMinimized && animationState !== 'exiting') return null;

    // Calculate window style
    const getWindowStyle = (): React.CSSProperties => {
        // Mobile: always fullscreen with animations
        if (isMobile) {
            const baseStyle: React.CSSProperties = {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: `calc(100% - var(--taskbar-height))`,
                zIndex: win.zIndex,
                transform: `translateY(${swipeOffset}px)`,
                transition: isSwipeActive ? 'none' : 'transform 0.2s ease-out',
            };

            if (animationState === 'entering') {
                baseStyle.animation = 'windowSlideUp 0.25s ease-out forwards';
            } else if (animationState === 'exiting') {
                baseStyle.animation = 'windowSlideDown 0.2s ease-in forwards';
            }

            return baseStyle;
        }

        // Desktop: maximized
        if (win.isMaximized) {
            return {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: `calc(100% - var(--taskbar-height))`,
                zIndex: win.zIndex,
            };
        }

        // Desktop: normal resizable window
        return {
            position: 'absolute',
            left: currentPosition.x,
            top: currentPosition.y,
            width: currentSize.width,
            height: currentSize.height,
            zIndex: win.zIndex,
        };
    };

    const swipeIndicatorOpacity = Math.min(swipeOffset / 80, 1);

    // Determine if resize handles should be shown
    const showResizeHandles = !isMobile && !win.isMaximized;

    return (
        <div
            ref={elementRef}
            className={`window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isMobile ? 'mobile' : ''} ${animationState}`}
            style={getWindowStyle()}
            onMouseDown={onFocus}
            onTouchStart={onFocus}
        >
            {/* Resize Handles (desktop only, not maximized) */}
            {showResizeHandles && RESIZE_HANDLES.map((direction) => (
                <div
                    key={direction}
                    className={`resize-handle resize-${direction}`}
                    onMouseDown={handleResizeStart(direction)}
                    onTouchStart={handleResizeStart(direction)}
                />
            ))}

            {/* Swipe Indicator (mobile only) */}
            {isMobile && swipeOffset > 0 && (
                <div
                    className="window-swipe-indicator"
                    style={{ opacity: swipeIndicatorOpacity }}
                >
                    <span>↓ Release to minimize</span>
                </div>
            )}

            {/* Title Bar */}
            <div
                ref={titleBarRef}
                className={`window-titlebar ${isSwipeActive ? 'swiping' : ''}`}
                onMouseDown={isMobile ? undefined : handleMouseDown}
                onTouchStart={handleTitleBarTouchStart}
                onTouchMove={handleTitleBarTouchMove}
                onTouchEnd={handleTitleBarTouchEnd}
            >
                <div className="window-title">
                    <span className="window-icon">{win.icon}</span>
                    <span className="window-title-text pixel-text">{win.title}</span>
                </div>
                <div className="window-controls">
                    <button
                        className="window-btn window-btn-minimize"
                        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                        aria-label="Minimize"
                    >
                        <span>_</span>
                    </button>
                    {!isMobile && (
                        <button
                            className="window-btn window-btn-maximize"
                            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
                            aria-label="Maximize"
                        >
                            <span>{win.isMaximized ? '❐' : '□'}</span>
                        </button>
                    )}
                    <button
                        className="window-btn window-btn-close"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        aria-label="Close"
                    >
                        <span>×</span>
                    </button>
                </div>
            </div>

            {/* Swipe Handle (mobile only) */}
            {isMobile && (
                <div className="window-swipe-handle">
                    <div className="swipe-handle-bar" />
                </div>
            )}

            {/* Content Area */}
            <div className="window-content">
                {children}
            </div>
        </div>
    );
};
