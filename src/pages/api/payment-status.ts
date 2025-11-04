import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactionId } = req.body;

    // PhonePe Configuration
    const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
    const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
    const PHONEPE_ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || 'UAT';

    // Create checksum for status check
    const checksumString = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}` + PHONEPE_SALT_KEY;
    const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + '###' + PHONEPE_SALT_INDEX;

    // PhonePe status check URL
    const statusUrl = PHONEPE_ENVIRONMENT === 'PROD'
      ? `https://api.phonepe.com/apis/hermes/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`
      : `https://api-preprod.phonepe.com/apis/hermes/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`;

    // Check payment status
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
        'accept': 'application/json'
      }
    });

    const responseData = await response.json();

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}