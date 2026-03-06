/**
 * ShareCardRenderer — Canvas-based engine for generating
 * Instagram-ready share cards from news posts.
 *
 * Three templates: WIN98, SPLIT, MIDNIGHT
 * Two formats:    STORY (1080×1920), POST (1080×1350)
 * Zero dependencies.
 */
import type { NewsPost } from '../../lib/supabase';

export type TemplateType = 'win98' | 'split' | 'midnight';
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

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
    });

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

const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, w: number, h: number,
) => {
    const imgRatio = img.width / img.height;
    const areaRatio = w / h;
    let sx: number, sy: number, sw: number, sh: number;
    if (imgRatio > areaRatio) {
        sh = img.height; sw = sh * areaRatio;
        sx = (img.width - sw) / 2; sy = 0;
    } else {
        sw = img.width; sh = sw / areaRatio;
        sx = 0; sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
};

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

const getScale = (H: number) => Math.max(0.82, H / 1920);

// ─── Win98 Border Helpers ───────────────────────────────

/** Draw Win98 raised (outward) 3D border */
const drawRaisedBorder = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, b: number = 3,
) => {
    // Outer highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, w, b);
    ctx.fillRect(x, y, b, h);
    // Outer shadow
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(x, y + h - b, w, b);
    ctx.fillRect(x + w - b, y, b, h);
    // Inner highlight
    ctx.fillStyle = '#DFDFDF';
    ctx.fillRect(x + b, y + b, w - b * 2, b);
    ctx.fillRect(x + b, y + b, b, h - b * 2);
    // Inner shadow
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + b, y + h - b * 2, w - b * 2, b);
    ctx.fillRect(x + w - b * 2, y + b, b, h - b * 2);
};

/** Draw Win98 sunken (inward) 3D border */
const drawSunkenBorder = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, b: number = 3,
) => {
    // Outer shadow
    ctx.fillStyle = '#808080';
    ctx.fillRect(x, y, w, b);
    ctx.fillRect(x, y, b, h);
    // Outer highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y + h - b, w, b);
    ctx.fillRect(x + w - b, y, b, h);
    // Inner shadow
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(x + b, y + b, w - b * 2, b);
    ctx.fillRect(x + b, y + b, b, h - b * 2);
    // Inner highlight
    ctx.fillStyle = '#DFDFDF';
    ctx.fillRect(x + b, y + h - b * 2, w - b * 2, b);
    ctx.fillRect(x + w - b * 2, y + b, b, h - b * 2);
};

// ─── Renderer ───────────────────────────────────────────

export class ShareCardRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

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
            case 'win98': this.renderWin98(post, postImage, logo, dims); break;
            case 'split': this.renderSplit(post, postImage, logo, dims); break;
            case 'midnight': this.renderMidnight(post, postImage, logo, dims); break;
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
    //  WIN98 — Authentic Windows 98 Window
    // ══════════════════════════════════════════

    private renderWin98(
        post: NewsPost,
        postImage: HTMLImageElement | null,
        logo: HTMLImageElement | null,
        dims: CardDimensions,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);
        const B = 3;
        const P = B * 2; // 6px padding/border total

        // ── Gray background + outer raised border ──
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(0, 0, W, H);
        drawRaisedBorder(ctx, 0, 0, W, H, B);

        // ── Title bar ──
        const tbH = Math.round(52 * s);
        const tbX = P;
        const tbY = P;
        const tbW = W - P * 2;

        const tbGrad = ctx.createLinearGradient(tbX, 0, tbX + tbW, 0);
        tbGrad.addColorStop(0, '#000080');
        tbGrad.addColorStop(1, '#008080');
        ctx.fillStyle = tbGrad;
        ctx.fillRect(tbX, tbY, tbW, tbH);

        // Title text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(24 * s)}px "VT323", monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('📰 NEWS.exe', tbX + Math.round(14 * s), tbY + tbH / 2);

        // Window buttons (minimize, maximize, close)
        const btnW = Math.round(34 * s);
        const btnH = Math.round(28 * s);
        const btnGap = Math.round(4 * s);
        const btnY = tbY + (tbH - btnH) / 2;
        const btnPad = Math.round(7 * s);

        // Close ×
        const closeX = tbX + tbW - btnW - Math.round(6 * s);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(closeX, btnY, btnW, btnH);
        drawRaisedBorder(ctx, closeX, btnY, btnW, btnH, 2);
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.round(22 * s)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeX + btnW / 2, btnY + btnH / 2);

        // Maximize □
        const maxX = closeX - btnW - btnGap;
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(maxX, btnY, btnW, btnH);
        drawRaisedBorder(ctx, maxX, btnY, btnW, btnH, 2);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(maxX + btnPad, btnY + btnPad, btnW - btnPad * 2, btnH - btnPad * 2);

        // Minimize _
        const minX = maxX - btnW - btnGap;
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(minX, btnY, btnW, btnH);
        drawRaisedBorder(ctx, minX, btnY, btnW, btnH, 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(minX + btnPad, btnY + btnH - btnPad - 3, btnW - btnPad * 2, 3);

        // ── Menu bar ──
        const mbY = tbY + tbH;
        const mbH = Math.round(38 * s);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(tbX, mbY, tbW, mbH);
        // Separator lines
        ctx.fillStyle = '#808080';
        ctx.fillRect(tbX, mbY + mbH - 1, tbW, 1);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(tbX, mbY + mbH, tbW, 1);

        // Menu items
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.round(20 * s)}px "Segoe UI", "MS Sans Serif", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        let mx = tbX + Math.round(14 * s);
        for (const item of ['File', 'Edit', 'View', 'Help']) {
            ctx.fillText(item, mx, mbY + mbH / 2);
            mx += ctx.measureText(item).width + Math.round(30 * s);
        }

        // ── Content area (sunken + dark VM interior) ──
        const ctY = mbY + mbH + 2;
        const sbH = Math.round(38 * s);
        const sbY = H - P - sbH;
        const ctH = sbY - ctY - Math.round(4 * s);

        drawSunkenBorder(ctx, tbX, ctY, tbW, ctH, B);
        // Dark interior
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(tbX + P, ctY + P, tbW - P * 2, ctH - P * 2);

        const ciX = tbX + P;
        const ciY = ctY + P;
        const ciW = tbW - P * 2;
        const ciH = ctH - P * 2;

        // ── Image inside content ──
        const imgPad = Math.round(24 * s);
        const imgX = ciX + imgPad;
        const imgW = ciW - imgPad * 2;
        const imgH = Math.round(ciH * 0.37);
        const imgY = ciY + imgPad;

        if (postImage) {
            // Sunken frame
            drawSunkenBorder(ctx, imgX - P, imgY - P, imgW + P * 2, imgH + P * 2, B);
            ctx.fillStyle = '#000000';
            ctx.fillRect(imgX, imgY, imgW, imgH);
            drawImageCover(ctx, postImage, imgX, imgY, imgW, imgH);
        }

        // ── Title ──
        const titleSize = Math.round(44 * s);
        const lineH = Math.round(58 * s);
        const postTitleY = postImage
            ? imgY + imgH + P + Math.round(28 * s)
            : ciY + Math.round(ciH * 0.08);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${titleSize}px "Segoe UI", "MS Sans Serif", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const titleLines = wrapText(ctx, post.title.toUpperCase(), imgW - 20).slice(0, 3);
        titleLines.forEach((line, i) => {
            ctx.fillText(line, ciX + ciW / 2, postTitleY + i * lineH);
        });

        // ── Date ──
        const dateSize = Math.round(22 * s);
        const dateY = postTitleY + titleLines.length * lineH + Math.round(12 * s);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = `${dateSize}px "Segoe UI", monospace`;
        ctx.fillText(formatDate(post.created_at), ciX + ciW / 2, dateY);

        // ── Branding (inside content) ──
        const bUrlSize = Math.round(36 * s);
        const bTagSize = Math.max(13, Math.round(16 * s));
        const bNameSize = Math.round(40 * s);
        const bLogoH = Math.round(110 * s);

        const bUrlY = ciY + ciH - Math.round(22 * s) - bUrlSize;
        const bTagY = bUrlY - Math.round(38 * s);
        const bNameY = bTagY - Math.round(40 * s);
        const bLogoBottom = bNameY - Math.round(14 * s);
        const bLogoTop = bLogoBottom - bLogoH;
        const bSepY = bLogoTop - Math.round(16 * s);

        // Separator
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ciX + ciW * 0.15, bSepY);
        ctx.lineTo(ciX + ciW * 0.85, bSepY);
        ctx.stroke();
        ctx.restore();

        // Logo
        if (logo) {
            const lw = (logo.width / logo.height) * bLogoH;
            ctx.drawImage(logo, ciX + (ciW - lw) / 2, bLogoTop, lw, bLogoH);
        }

        // "VRANOV MUSIC"
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${bNameSize}px "VT323", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('VRANOV MUSIC', ciX + ciW / 2, bNameY);

        // Tagline
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `bold ${bTagSize}px "Impact", "Arial Black", sans-serif`;
        ctx.letterSpacing = '4px';
        ctx.fillText('MIDDLE EUROPE CONTINENT .', ciX + ciW / 2, bTagY);
        ctx.letterSpacing = '0px';

        // URL
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${bUrlSize}px "IBM Plex Mono", monospace`;
        ctx.fillText('vranovmusic.eu', ciX + ciW / 2, bUrlY);

        // ── Status bar ──
        drawSunkenBorder(ctx, tbX, sbY, tbW, sbH, 2);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(tbX + 4, sbY + 4, tbW - 8, sbH - 8);

        // Divider in status bar
        const sbMid = tbX + Math.round(tbW * 0.55);
        ctx.fillStyle = '#808080';
        ctx.fillRect(sbMid, sbY + 5, 1, sbH - 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sbMid + 1, sbY + 5, 1, sbH - 10);

        ctx.fillStyle = '#000000';
        ctx.font = `${Math.round(18 * s)}px "Segoe UI", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('Ready', tbX + Math.round(14 * s), sbY + sbH / 2);
        ctx.fillText('vranovmusic.eu', sbMid + Math.round(12 * s), sbY + sbH / 2);
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

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W / 2, H);
        ctx.fillStyle = '#000000';
        ctx.fillRect(W / 2, 0, W / 2, H);

        ctx.fillStyle = 'rgba(128,128,128,0.12)';
        ctx.fillRect(W / 2 - 1, 0, 2, H);

        const pad = 60;
        const imgW = W - pad * 2;
        const imgH = Math.round(H * 0.38);
        const imgX = pad;
        const imgY = Math.round(H * 0.13);

        if (postImage) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 65;
            ctx.shadowOffsetY = 18;
            ctx.fillStyle = '#000';
            ctx.fillRect(imgX, imgY, imgW, imgH);
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.rect(imgX, imgY, imgW, imgH);
            ctx.clip();
            drawImageCover(ctx, postImage, imgX, imgY, imgW, imgH);
            ctx.restore();

            ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(imgX, imgY, imgW, imgH);
        }

        const titleSize = Math.round(48 * s);
        const lineH = Math.round(64 * s);
        const titleY = postImage ? imgY + imgH + Math.round(60 * s) : Math.round(H * 0.38);

        ctx.font = `bold ${titleSize}px "IBM Plex Mono", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = wrapText(ctx, post.title.toUpperCase(), W - 140).slice(0, 3);
        lines.forEach((line, i) => {
            const ly = titleY + i * lineH;
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = '#000000';
            ctx.fillText(line, W / 2, ly);
            ctx.restore();
            ctx.save();
            ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(line, W / 2, ly);
            ctx.restore();
        });

        const dateSize = Math.round(22 * s);
        const dateY = titleY + lines.length * lineH + Math.round(18 * s);
        const dateStr = formatDate(post.created_at);
        ctx.font = `${dateSize}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillText(dateStr, W / 2, dateY);
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText(dateStr, W / 2, dateY);
        ctx.restore();

        this.drawSplitBranding(logo, dims);
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

        const ov = ctx.createLinearGradient(0, 0, 0, H);
        ov.addColorStop(0, 'rgba(0, 0, 30, 0.5)');
        ov.addColorStop(0.25, 'rgba(0, 0, 20, 0.15)');
        ov.addColorStop(0.75, 'rgba(0, 0, 10, 0.2)');
        ov.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
        ctx.fillStyle = ov;
        ctx.fillRect(0, 0, W, H);

        const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.1, Math.round(40 * s));
        ctx.lineTo(W * 0.9, Math.round(40 * s));
        ctx.stroke();
        ctx.restore();

        const pad = 60;
        const imgW = W - pad * 2;
        const imgH = Math.round(H * 0.38);
        const imgX = pad;
        const imgY = Math.round(H * 0.13);

        if (postImage) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
            ctx.shadowBlur = 60;
            ctx.shadowOffsetY = 14;
            roundRect(ctx, imgX, imgY, imgW, imgH, 16);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();

            ctx.save();
            roundRect(ctx, imgX, imgY, imgW, imgH, 16);
            ctx.clip();
            drawImageCover(ctx, postImage, imgX, imgY, imgW, imgH);
            ctx.restore();

            ctx.save();
            roundRect(ctx, imgX, imgY, imgW, imgH, 16);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        const titleSize = Math.round(48 * s);
        const lineH = Math.round(64 * s);
        const titleY = postImage ? imgY + imgH + Math.round(60 * s) : Math.round(H * 0.35);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${titleSize}px "IBM Plex Mono", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = wrapText(ctx, post.title.toUpperCase(), W - 140).slice(0, 3);
        lines.forEach((line, i) => ctx.fillText(line, W / 2, titleY + i * lineH));

        const dateSize = Math.round(24 * s);
        const dateY = titleY + lines.length * lineH + Math.round(20 * s);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = `${dateSize}px "IBM Plex Mono", monospace`;
        ctx.fillText(formatDate(post.created_at), W / 2, dateY);

        this.drawBranding(logo, dims, '#FFFFFF', 'rgba(255,255,255,0.3)');

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
    //  BRANDING SECTIONS
    // ══════════════════════════════════════════

    private drawBranding(
        logo: HTMLImageElement | null,
        dims: CardDimensions,
        textColor: string,
        subtextColor: string,
    ) {
        const { ctx } = this;
        const { width: W, height: H } = dims;
        const s = getScale(H);

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

        ctx.save();
        ctx.strokeStyle = subtextColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.15, sepY);
        ctx.lineTo(W * 0.85, sepY);
        ctx.stroke();
        ctx.restore();

        if (logo) {
            const lw = (logo.width / logo.height) * logoH;
            ctx.drawImage(logo, (W - lw) / 2, logoTopY, lw, logoH);
        }

        ctx.fillStyle = textColor;
        ctx.font = `bold ${brandSize}px "VT323", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('VRANOV MUSIC', W / 2, brandY);

        ctx.fillStyle = subtextColor;
        ctx.font = `bold ${taglineSize}px "Impact", "Arial Black", sans-serif`;
        ctx.letterSpacing = '4px';
        ctx.fillText('MIDDLE EUROPE CONTINENT .', W / 2, taglineY);
        ctx.letterSpacing = '0px';

        ctx.fillStyle = textColor;
        ctx.font = `bold ${urlSize}px "IBM Plex Mono", monospace`;
        ctx.fillText('vranovmusic.eu', W / 2, urlY);
    }

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
        const logoH = Math.round(120 * s);

        const urlY = H - Math.round(48 * s);
        const taglineY = urlY - Math.round(44 * s);
        const brandY = taglineY - Math.round(44 * s);
        const logoBottomY = brandY - Math.round(18 * s);
        const logoTopY = logoBottomY - logoH;
        const sepY = logoTopY - Math.round(24 * s);

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

        splitLine(W * 0.15, W * 0.85, sepY);

        if (logo) {
            const lw = (logo.width / logo.height) * logoH;
            ctx.drawImage(logo, (W - lw) / 2, logoTopY, lw, logoH);
        }

        splitText('VRANOV MUSIC', `bold ${brandSize}px "VT323", monospace`, brandY, '#000', '#FFF');

        ctx.letterSpacing = '4px';
        splitText('MIDDLE EUROPE CONTINENT .', `bold ${taglineSize}px "Impact", "Arial Black", sans-serif`, taglineY, 'rgba(0,0,0,0.35)', 'rgba(255,255,255,0.35)');
        ctx.letterSpacing = '0px';

        splitText('vranovmusic.eu', `bold ${urlSize}px "IBM Plex Mono", monospace`, urlY, '#000', '#FFF');
    }
}
