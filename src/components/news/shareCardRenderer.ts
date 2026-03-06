/**
 * ShareCardRenderer — Canvas-based engine for generating
 * Instagram-ready share cards from news posts.
 *
 * Three templates: MIDNIGHT, SPLIT, NEON
 * Two formats:    STORY (1080×1920), POST (1080×1350)
 * Zero dependencies.
 */
import type { NewsPost } from '../../lib/supabase';

export type TemplateType = 'midnight' | 'split' | 'neon';
export type FormatType = 'story' | 'post';

interface CardDimensions {
    width: number;
    height: number;
}

const DIMENSIONS: Record<FormatType, CardDimensions> = {
    story: { width: 1080, height: 1920 },
    post: { width: 1080, height: 1350 },
};

// ─── Helpers ────────────────────────────────────────────

/** Load an image with CORS support */
const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
    });

/** Wrap text into lines that fit within maxWidth */
const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
};

/** Trace a rounded rectangle path */
const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

/** Draw image with "cover" behaviour — fills area, crops excess */
const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, w: number, h: number,
) => {
    const imgRatio = img.width / img.height;
    const areaRatio = w / h;
    let sx: number, sy: number, sw: number, sh: number;

    if (imgRatio > areaRatio) {
        sh = img.height;
        sw = sh * areaRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
    } else {
        sw = img.width;
        sh = sw / areaRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
};

/** Format date for display */
const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

/** Proportional scale factor — floors at 0.82 so post format stays readable */
const getScale = (H: number) => Math.max(0.82, H / 1920);

// ─── Renderer ───────────────────────────────────────────

export class ShareCardRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    // ────────────── public API ──────────────

    async render(
        post: NewsPost,
        template: TemplateType,
        format: FormatType,
    ): Promise<void> {
        await document.fonts.ready;

        const dims = DIMENSIONS[format];
        this.canvas.width = dims.width;
        this.canvas.height = dims.height;

        const imageUrl = post.image_urls?.[0] || post.image_url;
        let postImage: HTMLImageElement | null = null;
        let logo: HTMLImageElement | null = null;

        try { if (imageUrl) postImage = await loadImage(imageUrl); } catch { /* ok */ }
        try { logo = await loadImage('/vm-logo.png'); } catch { /* ok */ }

        switch (template) {
            case 'midnight': this.renderMidnight(post, postImage, logo, dims); break;
            case 'split': this.renderSplit(post, postImage, logo, dims); break;
            case 'neon': this.renderNeon(post, postImage, logo, dims); break;
        }
    }

    async toBlob(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error('Canvas export failed')),
                'image/png', 1.0,
            );
        });
    }

    // ══════════════════════════════════════════
    //  MIDNIGHT — Album Announcement Poster
    // ══════════════════════════════════════════

    private renderMidnight(
        post: NewsPost,
        postImage: HTMLImageElement | null,
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);

        // ── Background ──
        if (postImage) {
            ctx.save();
            ctx.filter = 'blur(30px) brightness(0.3) saturate(1.3)';
            drawImageCover(ctx, postImage, -40, -40, W + 80, H + 80);
            ctx.restore();
        } else {
            const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
            g.addColorStop(0, '#0a0a2e');
            g.addColorStop(0.5, '#0d0520');
            g.addColorStop(1, '#000000');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }

        // ── Gradient overlay — cinematic ──
        const ov = ctx.createLinearGradient(0, 0, 0, H);
        ov.addColorStop(0, 'rgba(0, 0, 30, 0.5)');
        ov.addColorStop(0.25, 'rgba(0, 0, 20, 0.15)');
        ov.addColorStop(0.75, 'rgba(0, 0, 10, 0.2)');
        ov.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
        ctx.fillStyle = ov;
        ctx.fillRect(0, 0, W, H);

        // ── Radial vignette ──
        const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        // ── Top accent line ──
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.1, Math.round(40 * s));
        ctx.lineTo(W * 0.9, Math.round(40 * s));
        ctx.stroke();
        ctx.restore();

        // ── Post image — big & prominent ──
        const pad = 60;
        const imgW = W - pad * 2;
        const imgH = Math.round(H * 0.38);
        const imgX = pad;
        const imgY = Math.round(H * 0.13);

        if (postImage) {
            // Shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
            ctx.shadowBlur = 60;
            ctx.shadowOffsetY = 14;
            roundRect(ctx, imgX, imgY, imgW, imgH, 16);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();

            // Image (rounded)
            ctx.save();
            roundRect(ctx, imgX, imgY, imgW, imgH, 16);
            ctx.clip();
            drawImageCover(ctx, postImage, imgX, imgY, imgW, imgH);
            ctx.restore();

            // Luminous border
            ctx.save();
            roundRect(ctx, imgX, imgY, imgW, imgH, 16);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        // ── Title ──
        const titleSize = Math.round(48 * s);
        const lineH = Math.round(64 * s);
        const titleY = postImage ? imgY + imgH + Math.round(60 * s) : Math.round(H * 0.35);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${titleSize}px "IBM Plex Mono", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = wrapText(ctx, post.title.toUpperCase(), W - 140).slice(0, 3);
        lines.forEach((line, i) => ctx.fillText(line, W / 2, titleY + i * lineH));

        // ── Date ──
        const dateSize = Math.round(24 * s);
        const dateY = titleY + lines.length * lineH + Math.round(20 * s);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = `${dateSize}px "IBM Plex Mono", monospace`;
        ctx.fillText(formatDate(post.created_at), W / 2, dateY);

        // ── Branding ──
        this.drawBranding(logo, dims, '#FFFFFF', 'rgba(255,255,255,0.3)');

        // ── Bottom accent line ──
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.1, H - Math.round(35 * s));
        ctx.lineTo(W * 0.9, H - Math.round(35 * s));
        ctx.stroke();
        ctx.restore();
    }

    // ══════════════════════════════════════════
    //  SPLIT — The VM Signature
    // ══════════════════════════════════════════

    private renderSplit(
        post: NewsPost,
        postImage: HTMLImageElement | null,
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);

        // ── Split background ──
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W / 2, H);
        ctx.fillStyle = '#000000';
        ctx.fillRect(W / 2, 0, W / 2, H);

        // ── Divider accent ──
        ctx.fillStyle = 'rgba(128,128,128,0.12)';
        ctx.fillRect(W / 2 - 1, 0, 2, H);

        // ── Image ──
        const pad = 60;
        const imgW = W - pad * 2;
        const imgH = Math.round(H * 0.38);
        const imgX = pad;
        const imgY = Math.round(H * 0.13);

        if (postImage) {
            // Shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 65;
            ctx.shadowOffsetY = 18;
            ctx.fillStyle = '#000';
            ctx.fillRect(imgX, imgY, imgW, imgH);
            ctx.restore();

            // Image (sharp edges — editorial)
            ctx.save();
            ctx.beginPath();
            ctx.rect(imgX, imgY, imgW, imgH);
            ctx.clip();
            drawImageCover(ctx, postImage, imgX, imgY, imgW, imgH);
            ctx.restore();

            // Border
            ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(imgX, imgY, imgW, imgH);
        }

        // ── Title — split-colored ──
        const titleSize = Math.round(48 * s);
        const lineH = Math.round(64 * s);
        const titleY = postImage ? imgY + imgH + Math.round(60 * s) : Math.round(H * 0.38);

        ctx.font = `bold ${titleSize}px "IBM Plex Mono", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = wrapText(ctx, post.title.toUpperCase(), W - 140).slice(0, 3);

        lines.forEach((line, i) => {
            const ly = titleY + i * lineH;
            // Left half — black on white
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = '#000000';
            ctx.fillText(line, W / 2, ly);
            ctx.restore();
            // Right half — white on black
            ctx.save();
            ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(line, W / 2, ly);
            ctx.restore();
        });

        // ── Date — split-colored ──
        const dateSize = Math.round(22 * s);
        const dateY = titleY + lines.length * lineH + Math.round(18 * s);
        const dateStr = formatDate(post.created_at);
        ctx.font = `${dateSize}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // Left
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillText(dateStr, W / 2, dateY);
        ctx.restore();
        // Right
        ctx.save();
        ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText(dateStr, W / 2, dateY);
        ctx.restore();

        // ── Split branding ──
        this.drawSplitBranding(logo, dims);
    }

    // ══════════════════════════════════════════
    //  NEON — OS Terminal / Cyberpunk
    // ══════════════════════════════════════════

    private renderNeon(
        post: NewsPost,
        postImage: HTMLImageElement | null,
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);
        const GREEN = '#00FF00';

        // ── Black background ──
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, W, H);

        // ── Subtle grid ──
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 60) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 60) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();

        // ── Image with multi-layer green glow ──
        const pad = 100;
        const imgW = W - pad * 2;
        const imgH = Math.round(H * 0.36);
        const imgX = pad;
        const imgY = Math.round(H * 0.13);

        if (postImage) {
            const glowLayers = [
                { expand: 16, alpha: 0.05, blur: 40 },
                { expand: 10, alpha: 0.1, blur: 20 },
                { expand: 5, alpha: 0.2, blur: 12 },
                { expand: 2, alpha: 0.7, blur: 5 },
            ];

            for (const gl of glowLayers) {
                ctx.save();
                ctx.strokeStyle = GREEN;
                ctx.globalAlpha = gl.alpha;
                ctx.shadowColor = GREEN;
                ctx.shadowBlur = gl.blur;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    imgX - gl.expand, imgY - gl.expand,
                    imgW + gl.expand * 2, imgH + gl.expand * 2,
                );
                ctx.restore();
            }

            // Image
            ctx.save();
            ctx.beginPath();
            ctx.rect(imgX, imgY, imgW, imgH);
            ctx.clip();
            drawImageCover(ctx, postImage, imgX, imgY, imgW, imgH);
            ctx.restore();

            // Inner border
            ctx.save();
            ctx.strokeStyle = GREEN;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 1;
            ctx.strokeRect(imgX, imgY, imgW, imgH);
            ctx.restore();
        }

        // ── Scanlines ──
        ctx.save();
        ctx.globalAlpha = 0.06;
        for (let y = 0; y < H; y += 3) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, y, W, 1);
        }
        ctx.restore();

        // ── Title — neon green with ">" prefix ──
        const titleSize = Math.round(50 * s);
        const lineH = Math.round(66 * s);
        const titleY = postImage ? imgY + imgH + Math.round(70 * s) : Math.round(H * 0.36);

        ctx.save();
        ctx.fillStyle = GREEN;
        ctx.font = `bold ${titleSize}px "VT323", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 20;

        const titleLines = wrapText(ctx, post.title.toUpperCase(), W - 240).slice(0, 3);
        // Double-pass for glow intensity
        for (let pass = 0; pass < 2; pass++) {
            titleLines.forEach((line, i) => {
                ctx.fillText(`> ${line}`, 100, titleY + i * lineH);
            });
        }
        ctx.restore();

        // ── Date in [bracket notation] ──
        const dateSize = Math.round(26 * s);
        const dateY = titleY + titleLines.length * lineH + Math.round(18 * s);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.font = `${dateSize}px "VT323", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const d = new Date(post.created_at);
        const neonDate = `[${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}]`;
        ctx.fillText(neonDate, 100, dateY);

        // ── Branding ──
        this.drawNeonBranding(logo, dims);
    }

    // ══════════════════════════════════════════
    //  BRANDING SECTIONS
    // ══════════════════════════════════════════

    /** Standard branding (Midnight) — large logo, tagline, big URL */
    private drawBranding(
        logo: HTMLImageElement | null,
        dims: CardDimensions,
        textColor: string,
        subtextColor: string,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);

        // Compute from bottom up
        const urlSize = Math.round(40 * s);
        const taglineSize = Math.max(14, Math.round(18 * s));
        const brandSize = Math.round(44 * s);
        const logoH = Math.round(120 * s);

        const urlY = H - Math.round(48 * s);
        const taglineY = urlY - Math.round(44 * s);
        const brandY = taglineY - Math.round(44 * s);
        const logoBottomY = brandY - Math.round(18 * s);
        const logoTopY = logoBottomY - logoH;
        const sepY = logoTopY - Math.round(24 * s);

        // Separator
        ctx.save();
        ctx.strokeStyle = subtextColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.15, sepY);
        ctx.lineTo(W * 0.85, sepY);
        ctx.stroke();
        ctx.restore();

        // Logo
        if (logo) {
            const lw = (logo.width / logo.height) * logoH;
            ctx.drawImage(logo, (W - lw) / 2, logoTopY, lw, logoH);
        }

        // "VRANOV MUSIC"
        ctx.fillStyle = textColor;
        ctx.font = `bold ${brandSize}px "VT323", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('VRANOV MUSIC', W / 2, brandY);

        // Tagline
        ctx.fillStyle = subtextColor;
        ctx.font = `bold ${taglineSize}px "Impact", "Arial Black", sans-serif`;
        ctx.letterSpacing = '4px';
        ctx.fillText('MIDDLE EUROPE CONTINENT .', W / 2, taglineY);
        ctx.letterSpacing = '0px';

        // URL — bold, prominent
        ctx.fillStyle = textColor;
        ctx.font = `bold ${urlSize}px "IBM Plex Mono", monospace`;
        ctx.fillText('vranovmusic.eu', W / 2, urlY);
    }

    /** Split branding — everything dual-colored */
    private drawSplitBranding(
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);

        const urlSize = Math.round(40 * s);
        const taglineSize = Math.max(14, Math.round(18 * s));
        const brandSize = Math.round(44 * s);
        const logoH = Math.round(140 * s);

        const urlY = H - Math.round(60 * s);
        const taglineY = urlY - Math.round(52 * s);
        const brandY = taglineY - Math.round(52 * s);
        const logoBottomY = brandY - Math.round(25 * s);
        const logoTopY = logoBottomY - logoH;
        const sepY = logoTopY - Math.round(35 * s);

        // Helper: draw split-colored text
        const splitText = (text: string, font: string, y: number, leftC: string, rightC: string) => {
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = leftC;
            ctx.fillText(text, W / 2, y);
            ctx.restore();
            ctx.save();
            ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = rightC;
            ctx.fillText(text, W / 2, y);
            ctx.restore();
        };

        // Helper: draw split-colored line
        const splitLine = (x1: number, x2: number, y: number) => {
            ctx.lineWidth = 1;
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
            ctx.restore();
            ctx.save();
            ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
            ctx.restore();
        };

        // Separator
        splitLine(W * 0.15, W * 0.85, sepY);

        // Logo
        if (logo) {
            const lw = (logo.width / logo.height) * logoH;
            ctx.drawImage(logo, (W - lw) / 2, logoTopY, lw, logoH);
        }

        // "VRANOV MUSIC"
        splitText('VRANOV MUSIC', `bold ${brandSize}px "VT323", monospace`, brandY, '#000', '#FFF');

        // Tagline
        ctx.letterSpacing = '4px';
        splitText('MIDDLE EUROPE CONTINENT .', `bold ${taglineSize}px "Impact", "Arial Black", sans-serif`, taglineY, 'rgba(0,0,0,0.35)', 'rgba(255,255,255,0.35)');
        ctx.letterSpacing = '0px';

        // URL
        splitText('vranovmusic.eu', `bold ${urlSize}px "IBM Plex Mono", monospace`, urlY, '#000', '#FFF');
    }

    /** Neon branding — green-on-black, glowing, terminal-style */
    private drawNeonBranding(
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);
        const GREEN = '#00FF00';

        const urlSize = Math.round(40 * s);
        const taglineSize = Math.max(14, Math.round(18 * s));
        const brandSize = Math.round(44 * s);
        const logoH = Math.round(140 * s);

        const urlY = H - Math.round(60 * s);
        const taglineY = urlY - Math.round(52 * s);
        const brandY = taglineY - Math.round(52 * s);
        const logoBottomY = brandY - Math.round(25 * s);
        const logoTopY = logoBottomY - logoH;
        const sepY = logoTopY - Math.round(35 * s);

        // Dashed separator
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(W * 0.1, sepY);
        ctx.lineTo(W * 0.9, sepY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Logo with green glow
        if (logo) {
            const lw = (logo.width / logo.height) * logoH;
            ctx.save();
            ctx.shadowColor = GREEN;
            ctx.shadowBlur = 25;
            ctx.drawImage(logo, (W - lw) / 2, logoTopY, lw, logoH);
            ctx.restore();
        }

        // "VRANOV MUSIC" — glowing
        ctx.save();
        ctx.fillStyle = GREEN;
        ctx.font = `bold ${brandSize}px "VT323", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 15;
        ctx.fillText('VRANOV MUSIC', W / 2, brandY);
        ctx.restore();

        // Tagline — dots instead of spaces
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.font = `bold ${taglineSize}px "VT323", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('MIDDLE.EUROPE.CONTINENT.', W / 2, taglineY);

        // URL — large, glowing
        ctx.save();
        ctx.fillStyle = GREEN;
        ctx.font = `bold ${urlSize}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 12;
        ctx.fillText('vranovmusic.eu', W / 2, urlY);
        ctx.restore();
    }
}
