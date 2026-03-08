import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await resend.emails.send({
            from: 'VRANOV MUSIC <hq@vranovmusic.eu>',
            to: ['hq@vranovmusic.eu'],
            replyTo: email,
            subject: `[CONTACT] ${name}`,
            html: `
                <div style="font-family: monospace; background: #0a0a0a; color: #fff; padding: 32px; max-width: 600px;">
                    <div style="background: #000080; color: #fff; padding: 6px 12px; font-weight: bold; margin-bottom: 16px;">
                        📨 NEWS.exe — New Contact Form Message
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="color: rgba(255,255,255,0.5); padding: 6px 0; width: 80px;">FROM:</td>
                            <td style="color: #fff; padding: 6px 0;">${name}</td>
                        </tr>
                        <tr>
                            <td style="color: rgba(255,255,255,0.5); padding: 6px 0;">EMAIL:</td>
                            <td style="color: #fff; padding: 6px 0;"><a href="mailto:${email}" style="color: #00ff88;">${email}</a></td>
                        </tr>
                    </table>
                    <hr style="border: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
                    <div style="color: rgba(255,255,255,0.5); margin-bottom: 8px;">MESSAGE:</div>
                    <div style="color: #fff; white-space: pre-wrap; line-height: 1.6;">${message}</div>
                    <hr style="border: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
                    <div style="color: rgba(255,255,255,0.3); font-size: 12px;">VRANOV MUSIC — MIDDLE EUROPE CONTINENT — vranovmusic.eu</div>
                </div>
            `,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Resend error:', err);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
