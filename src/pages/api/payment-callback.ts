import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // PhonePe sends payment callback data
    const callbackData = req.body;
    
    console.log('Payment callback received:', callbackData);

    // Basic processing flow:
    // 1. (TODO) Verify callback signature according to PhonePe docs
    // 2. Find payment row by merchantTransactionId and update status and phonepe_transaction_id
    // 3. If success, create membership row

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Service role key not configured; cannot finalize payment server-side');
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const serverSupabase = createClient(supabaseUrl, serviceRoleKey);

    const merchantTxnId = callbackData.merchantTransactionId || callbackData.merchantTransactionId || callbackData.merchantTransactionId;
    const phonepeTxnId = callbackData.transactionId || callbackData.phonepeTransactionId || null;
    const code = callbackData.code || callbackData.status || null; // e.g., PAYMENT_SUCCESS

    if (!merchantTxnId) {
      console.error('No merchantTransactionId in callback');
      return res.status(400).json({ success: false, error: 'Missing merchantTransactionId' });
    }

    // Find the pending payment
    const { data: payments, error: findErr } = await serverSupabase
      .from('payments')
      .select('*')
      .eq('phonepe_merchant_transaction_id', merchantTxnId)
      .limit(1)
      .maybeSingle();

    if (findErr) {
      console.error('Error finding payment row:', findErr);
    }

    const paymentRow: any = payments;

    // Update payment status and store phonepe transaction id
    const newStatus = (code && code.toString().toUpperCase().includes('SUCCESS')) ? 'success' : 'failed';

    try {
      await serverSupabase.from('payments').update({
        status: newStatus,
        phonepe_transaction_id: phonepeTxnId || null,
        updated_at: new Date().toISOString()
      }).eq('phonepe_merchant_transaction_id', merchantTxnId);
    } catch (uErr) {
      console.error('Failed to update payment row:', uErr);
    }

    if (newStatus === 'success') {
      // Create membership for the user (if payment row exists)
      try {
        const userId = paymentRow?.user_id;
        const messId = paymentRow?.mess_id;
        const subscriptionType = paymentRow?.subscription_type || 'full_month';

        if (userId && messId) {
          const joinDate = new Date();
          let expiry = new Date(joinDate.getTime());
          if (subscriptionType === 'half_month') {
            expiry.setDate(expiry.getDate() + 15);
          } else {
            expiry.setMonth(expiry.getMonth() + 1);
          }

          await serverSupabase.from('mess_members').insert([{
            user_id: userId,
            mess_id: messId,
            subscription_type: subscriptionType,
            payment_status: 'success',
            joining_date: joinDate.toISOString().split('T')[0],
            expiry_date: expiry.toISOString().split('T')[0],
            is_active: true,
            created_at: new Date().toISOString()
          }]);
        } else {
          console.warn('Payment row missing user_id or mess_id; skipping membership creation');
        }
      } catch (memErr) {
        console.error('Failed to create membership:', memErr);
      }
    }

    return res.status(200).json({ success: true, message: 'Callback processed' });

  } catch (error) {
    console.error('Payment callback error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}