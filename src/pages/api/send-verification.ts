import type { NextApiRequest, NextApiResponse } from 'next';

type Data = { success: boolean; message?: string };

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { email, name, redirectUrl } = req.body || {};
  if (!email) return res.status(400).json({ success: false, message: 'Missing email' });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, message: 'BREVO_API_KEY not configured on server' });

  // Create a simple token (base64 of email|ts) signed optionally with EMAIL_SECRET
  const payload = `${email}|${Date.now()}`;
  let token = Buffer.from(payload).toString('base64');
  const secret = process.env.EMAIL_SECRET;
  if (secret) {
    const crypto = await import('crypto');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    token = `${token}.${sig}`;
  }

  const verifyBase = redirectUrl || process.env.EMAIL_VERIFICATION_REDIRECT || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email`;
  const verifyUrl = `${verifyBase}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const sender = { name: 'Om Sai Bhojnalay', email: process.env.FROM_EMAIL || 'no-reply@omsai.example' };

  const htmlContent = `
    <h2>Welcome to Om Sai Bhojnalay</h2>
    <p>Hello ${name || ''},</p>
    <p>Thanks for registering. Please verify your email by clicking the button below:</p>
    <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#ea580c;color:#fff;border-radius:6px;text-decoration:none">Verify Email</a></p>
    <p>If the button doesn't work, open this link in your browser:</p>
    <p><small>${verifyUrl}</small></p>
  `;

  try {
    const resp = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email }],
        subject: 'Verify your email for Om Sai Bhojnalay',
        htmlContent,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Brevo send failed:', resp.status, text);
      return res.status(500).json({ success: false, message: 'Failed to send verification email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error sending verification email:', err);
    return res.status(500).json({ success: false, message: 'Internal error sending email' });
  }
}
