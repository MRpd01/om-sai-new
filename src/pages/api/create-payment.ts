import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, userId, planType, userEmail, userName } = req.body;
    const messId = req.body.messId || null;
    const joinDate = req.body.joinDate || null;

    // PhonePe Configuration (use environment variables in production)
    const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
    const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
    const PHONEPE_ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || 'UAT'; // UAT for testing, PROD for production

    // Generate unique transaction ID
    const transactionId = `TXN_${Date.now()}_${userId}`;
    const merchantUserId = `USER_${userId}`;

    // Persist pending payment server-side using service role key
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      if (!supabaseUrl || !serviceRoleKey) {
        console.warn('Service role key or supabase URL not configured; skipping DB persist');
      } else {
        const serverSupabase = createClient(supabaseUrl, serviceRoleKey);
        await serverSupabase.from('payments').insert([{
          user_id: userId,
          mess_id: messId,
          amount: amount,
          phonepe_merchant_transaction_id: transactionId,
          status: 'pending',
          subscription_type: planType,
          created_at: new Date().toISOString()
        }]);
      }
    } catch (dbErr) {
      console.error('Failed to persist pending payment:', dbErr);
    }

    // Create payment payload
    const paymentPayload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: merchantUserId,
      amount: amount * 100, // PhonePe expects amount in paise (smallest currency unit)
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-success?txnId=${transactionId}`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment-callback`,
      mobileNumber: '9999999999', // You can get this from user profile
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Encode payload to base64
    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

    // Create checksum
    const checksumString = base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY;
    const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + '###' + PHONEPE_SALT_INDEX;

    // PhonePe API URL
    const phonepeUrl = PHONEPE_ENVIRONMENT === 'PROD' 
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
      : 'https://api-preprod.phonepe.com/apis/hermes/pg/v1/pay';

    // Make request to PhonePe
    const response = await fetch(phonepeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const responseData = await response.json();

    if (responseData.success && responseData.data?.instrumentResponse?.redirectInfo?.url) {
      // Return the payment URL to redirect user
      return res.status(200).json({
        success: true,
        paymentUrl: responseData.data.instrumentResponse.redirectInfo.url,
        transactionId: transactionId,
        merchantTransactionId: transactionId
      });
    } else {
      console.error('PhonePe API Error:', responseData);
      return res.status(400).json({
        success: false,
        error: 'Failed to create payment',
        details: responseData
      });
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}