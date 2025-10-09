// Example serverless endpoint to create a Razorpay order using server-side secret
// This file is a starting point. Add your RAZORPAY_KEY_SECRET and RAZORPAY_KEY_ID in Vercel env vars.

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { amount, currency = 'INR', receipt } = req.body;

  // For security, do not use Razorpay secrets in client code. Use server-side env vars.
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay keys' });

  // Replace with Razorpay REST call
  // const rzpRes = await fetch('https://api.razorpay.com/v1/orders', { ... })

  // For demo, return a fake order
  return res.status(200).json({ id: `order_${Date.now()}`, amount, currency, receipt });
}
