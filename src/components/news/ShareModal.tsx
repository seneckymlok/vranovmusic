import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShareCardRenderer, type TemplateType, type FormatType } from './shareCardRenderer';
import type { NewsPost } from '../../lib/supabase';
import './ShareModal.css';

interface ShareModalProps {
    post: NewsPost;
    onClose: () => void;
}

const TEMPLATES: { id: TemplateType; label: string; icon: string }[] = [
    { id: 'midnight', label: 'MIDNIGHT', icon: '🌙' },
    { id: 'split', label: 'SPLIT', icon: '◐' },
    { id: 'neon', label: 'NEON', icon: '⚡' },
];

const FORMATS: { id: FormatType; label: string; ratio: string }[] = [
    { id: 'story', label: 'STORY', ratio: '9:16' },
    { id: 'post', label: 'POST', ratio: '4:5' },
];

export const ShareModal: React.FC<ShareModalProps> = ({ post, onClose }) => {
    const [template, setTemplate] = useState<TemplateType>('midnight');
    const [format, setFormat] = useState<FormatType>('story');
    const [isRendering, setIsRendering] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<ShareCardRenderer | null>(null);

    // ── Render preview whenever template / format changes ──
    const renderPreview = useCallback(async () => {
        if (!canvasRef.current) return;
        setIsRendering(true);

        if (!rendererRef.current) {
            rendererRef.current = new ShareCardRenderer(canvasRef.current);
        }

        try {
            await rendererRef.current.render(post, template, format);
        } catch (err) {
            console.error('Share card render error:', err);
        }

        setIsRendering(false);
    }, [post, template, format]);

    useEffect(() => { renderPreview(); }, [renderPreview]);

    // ── ESC to close ──
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // ── Download as PNG ──
    const handleDownload = async () => {
        if (!rendererRef.current) return;
        setIsExporting(true);

        try {
            const blob = await rendererRef.current.toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vranov-music-${post.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
        }

        setIsExporting(false);
    };

    // ── Web Share API (Instagram / other apps) ──
    const handleShare = async () => {
        if (!rendererRef.current) return;
        setIsExporting(true);

        try {
            const blob = await rendererRef.current.toBlob();
            const file = new File([blob], 'vranov-music-share.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: post.title,
                    text: `${post.title} — VRANOV MUSIC`,
                    files: [file],
                });
            } else {
                // Fallback to download
                await handleDownload();
            }
        } catch (err) {
            // User cancelled share dialog — not an error
            if ((err as Error).name !== 'AbortError') {
                console.error('Share error:', err);
                await handleDownload();
            }
        }

        setIsExporting(false);
    };

    const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

    return (
        <div className="share-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>

                {/* ── Title bar ── */}
                <div className="share-titlebar">
                    <div className="share-titlebar-text">
                        <span>📤</span>
                        <span className="pixel-text">SHARE POST</span>
                    </div>
                    <button className="share-titlebar-close" onClick={onClose}>
                        <span>×</span>
                    </button>
                </div>

                {/* ── Preview ── */}
                <div className={`share-preview ${format}`}>
                    {isRendering && (
                        <div className="share-preview-spinner">
                            <span className="animate-blink">RENDERING…</span>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="share-canvas"
                        style={{ opacity: isRendering ? 0.3 : 1 }}
                    />
                </div>

                {/* ── Controls ── */}
                <div className="share-controls">
                    {/* Template selector */}
                    <div className="share-ctrl-row">
                        <span className="share-ctrl-label">TEMPLATE</span>
                        <div className="share-template-bar">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    className={`btn-98 share-tpl-btn ${template === t.id ? 'active' : ''}`}
                                    onClick={() => setTemplate(t.id)}
                                >
                                    <span className="share-tpl-icon">{t.icon}</span>
                                    <span className="share-tpl-label">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format toggle */}
                    <div className="share-ctrl-row">
                        <span className="share-ctrl-label">FORMAT</span>
                        <div className="share-format-bar">
                            {FORMATS.map((f) => (
                                <button
                                    key={f.id}
                                    className={`btn-98 share-fmt-btn ${format === f.id ? 'active' : ''}`}
                                    onClick={() => setFormat(f.id)}
                                >
                                    {f.label} <span className="share-fmt-ratio">({f.ratio})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Action buttons ── */}
                <div className="share-actions">
                    <button
                        className="btn-98 share-btn-download"
                        onClick={handleDownload}
                        disabled={isExporting || isRendering}
                    >
                        {isExporting ? '…' : '💾 SAVE IMAGE'}
                    </button>
                    {canNativeShare && (
                        <button
                            className="btn-98 share-btn-share"
                            onClick={handleShare}
                            disabled={isExporting || isRendering}
                        >
                            {isExporting ? '…' : '📤 SHARE'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
