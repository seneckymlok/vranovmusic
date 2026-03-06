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

/** Format a date string for display */
const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

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

        // Load assets (graceful failures)
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

    // ────────────── MIDNIGHT ──────────────

    private renderMidnight(
        post: NewsPost,
        postImage: HTMLImageElement | null,
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;

        // 1 ▸ Background — blurred post image or gradient fallback
        if (postImage) {
            ctx.save();
            ctx.filter = 'blur(28px) brightness(0.35) saturate(1.2)';
            drawImageCover(ctx, postImage, -30, -30, W + 60, H + 60);
            ctx.restore();
        } else {
            const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
            g.addColorStop(0, '#0a0a2e');
            g.addColorStop(0.5, '#0d0520');
            g.addColorStop(1, '#000000');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }

        // 2 ▸ Gradient overlay — cinematic depth
        const overlay = ctx.createLinearGradient(0, 0, 0, H);
        overlay.addColorStop(0, 'rgba(0, 0, 40, 0.55)');
        overlay.addColorStop(0.3, 'rgba(0, 0, 20, 0.2)');
        overlay.addColorStop(0.7, 'rgba(0, 0, 20, 0.25)');
        overlay.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, W, H);

        // 3 ▸ Subtle vignette
        const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.9);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        // 4 ▸ Clean centered image
        const pad = 90;
        const imgW = W - pad * 2;
        const imgH = Math.round(imgW * 0.7);
        const imgX = pad;
        const imgY = Math.round(H * 0.17);

        if (postImage) {
            // Drop shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 50;
            ctx.shadowOffsetY = 12;
            roundRect(ctx, imgX, imgY, imgW, imgH, 14);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();

            // Image (rounded clip)
            ctx.save();
            roundRect(ctx, imgX, imgY, imgW, imgH, 14);
            ctx.clip();
            drawImageCover(ctx, postImage, imgX, imgY, imgW, imgH);
            ctx.restore();

            // Thin luminous border
            ctx.save();
            roundRect(ctx, imgX, imgY, imgW, imgH, 14);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        // 5 ▸ Title
        const titleY = postImage ? imgY + imgH + 80 : Math.round(H * 0.38);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 52px "IBM Plex Mono", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = wrapText(ctx, post.title.toUpperCase(), W - 160).slice(0, 3);
        lines.forEach((line, i) => ctx.fillText(line, W / 2, titleY + i * 68));

        // 6 ▸ Date
        const dateY = titleY + lines.length * 68 + 24;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '24px "IBM Plex Mono", monospace';
        ctx.fillText(formatDate(post.created_at), W / 2, dateY);

        // 7 ▸ Branding
        this.drawBranding(logo, dims, '#FFFFFF', 'rgba(255,255,255,0.35)');
    }

    // ────────────── SPLIT ──────────────

    private renderSplit(
        post: NewsPost,
        postImage: HTMLImageElement | null,
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;

        // 1 ▸ Split background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W / 2, H);
        ctx.fillStyle = '#000000';
        ctx.fillRect(W / 2, 0, W / 2, H);

        // 2 ▸ Thin divider accent
        ctx.fillStyle = 'rgba(128,128,128,0.15)';
        ctx.fillRect(W / 2 - 1, 0, 2, H);

        // 3 ▸ Image
        const pad = 90;
        const imgW = W - pad * 2;
        const imgH = Math.round(imgW * 0.7);
        const imgX = pad;
        const imgY = Math.round(H * 0.25);

        if (postImage) {
            // Shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 60;
            ctx.shadowOffsetY = 16;
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
            ctx.strokeStyle = 'rgba(128, 128, 128, 0.25)';
            ctx.lineWidth = 2;
            ctx.strokeRect(imgX, imgY, imgW, imgH);
        }

        // 4 ▸ Title — split-colored
        const titleY = postImage ? imgY + imgH + 80 : Math.round(H * 0.4);
        ctx.font = 'bold 48px "IBM Plex Mono", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = wrapText(ctx, post.title.toUpperCase(), W - 160).slice(0, 3);
        lines.forEach((line, i) => {
            const ly = titleY + i * 64;
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

        // 5 ▸ Date — split-colored
        const dateY = titleY + lines.length * 64 + 24;
        ctx.font = '22px "IBM Plex Mono", monospace';
        const dateStr = formatDate(post.created_at);
        // Left
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(dateStr, W / 2, dateY);
        ctx.restore();
        // Right
        ctx.save();
        ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(dateStr, W / 2, dateY);
        ctx.restore();

        // 6 ▸ Split branding
        this.drawSplitBranding(logo, dims);
    }

    // ────────────── NEON ──────────────

    private renderNeon(
        post: NewsPost,
        postImage: HTMLImageElement | null,
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const GREEN = '#00FF00';

        // 1 ▸ Pure black
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, W, H);

        // 2 ▸ Subtle grid pattern
        ctx.save();
        ctx.globalAlpha = 0.035;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 60) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 60) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();

        // 3 ▸ Image with multi-layer green glow
        const pad = 120;
        const imgW = W - pad * 2;
        const imgH = Math.round(imgW * 0.7);
        const imgX = pad;
        const imgY = Math.round(H * 0.18);

        if (postImage) {
            // Glow layers (outermost → innermost)
            const glowLayers = [
                { expand: 14, alpha: 0.06, blur: 35 },
                { expand: 8, alpha: 0.12, blur: 18 },
                { expand: 4, alpha: 0.25, blur: 10 },
                { expand: 1, alpha: 0.8, blur: 4 },
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

            // Inner green border
            ctx.strokeStyle = GREEN;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 1;
            ctx.strokeRect(imgX, imgY, imgW, imgH);
            ctx.globalAlpha = 1;
        }

        // 4 ▸ Scanlines overlay
        ctx.save();
        ctx.globalAlpha = 0.07;
        for (let y = 0; y < H; y += 3) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, y, W, 1);
        }
        ctx.restore();

        // 5 ▸ Title — neon green with glow
        const titleY = postImage ? imgY + imgH + 90 : Math.round(H * 0.38);
        ctx.save();
        ctx.fillStyle = GREEN;
        ctx.font = 'bold 52px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 20;

        const lines = wrapText(ctx, post.title.toUpperCase(), W - 180).slice(0, 3);
        // Draw twice for extra glow intensity
        for (let pass = 0; pass < 2; pass++) {
            lines.forEach((line, i) => ctx.fillText(line, W / 2, titleY + i * 68));
        }
        ctx.restore();

        // 6 ▸ Date
        const dateY = titleY + lines.length * 68 + 24;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.35)';
        ctx.font = '26px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(formatDate(post.created_at), W / 2, dateY);

        // 7 ▸ Branding
        this.drawBranding(logo, dims, GREEN, 'rgba(0, 255, 0, 0.35)');
    }

    // ────────────── Shared Branding ──────────────

    private drawBranding(
        logo: HTMLImageElement | null,
        dims: CardDimensions,
        textColor: string,
        subtextColor: string,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const baseY = H - 120;

        // Separator line
        ctx.save();
        ctx.strokeStyle = subtextColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.3, baseY - 30);
        ctx.lineTo(W * 0.7, baseY - 30);
        ctx.stroke();
        ctx.restore();

        // Logo
        if (logo) {
            const lh = 55;
            const lw = (logo.width / logo.height) * lh;
            ctx.drawImage(logo, (W - lw) / 2, baseY - 15, lw, lh);
        }

        // "VRANOV MUSIC"
        ctx.fillStyle = textColor;
        ctx.font = 'bold 30px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('VRANOV MUSIC', W / 2, baseY + 50);

        // URL
        ctx.fillStyle = subtextColor;
        ctx.font = '22px "IBM Plex Mono", monospace';
        ctx.fillText('vranovmusic.eu', W / 2, baseY + 82);
    }

    private drawSplitBranding(
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const baseY = H - 120;

        // Separator — split colored
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(W * 0.3, baseY - 30); ctx.lineTo(W * 0.7, baseY - 30); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(W * 0.3, baseY - 30); ctx.lineTo(W * 0.7, baseY - 30); ctx.stroke();
        ctx.restore();

        // Logo
        if (logo) {
            const lh = 55;
            const lw = (logo.width / logo.height) * lh;
            ctx.drawImage(logo, (W - lw) / 2, baseY - 15, lw, lh);
        }

        // Text — split
        const drawSplitText = (text: string, font: string, y: number, leftColor: string, rightColor: string) => {
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = leftColor;
            ctx.fillText(text, W / 2, y);
            ctx.restore();
            ctx.save();
            ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = rightColor;
            ctx.fillText(text, W / 2, y);
            ctx.restore();
        };

        drawSplitText('VRANOV MUSIC', 'bold 30px "VT323", monospace', baseY + 50, '#000', '#FFF');
        drawSplitText('vranovmusic.eu', '22px "IBM Plex Mono", monospace', baseY + 82, 'rgba(0,0,0,0.4)', 'rgba(255,255,255,0.4)');
    }
}
