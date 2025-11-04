import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const PLAN_PRICES: Record<string, number> = {
  full_month: 2600,
  half_month: 1300,
  double_time: 2600,
  single_time: 1500,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) return res.status(401).json({ error: 'Missing access token' });

    // verify calling user
    const { data: callerData, error: callerErr } = await supabase.auth.getUser(token as string);
    if (callerErr || !callerData?.user) return res.status(401).json({ error: 'Invalid token' });
    const caller = callerData.user;

    // verify caller is admin
    const { data: callerProfile, error: profileErr } = await supabase
      .from('users')
      .select('role,mess_id')
      .eq('id', caller.id)
      .maybeSingle();

    if (profileErr) return res.status(500).json({ error: 'Failed to fetch caller profile' });
    if (!callerProfile || callerProfile.role !== 'admin') return res.status(403).json({ error: 'Only admin can assign subscriptions' });

    const { userEmail, plan, joiningDate, paymentAmount = 0, paymentType = 'full' } = req.body;
    if (!userEmail || !plan || !joiningDate) return res.status(400).json({ error: 'Missing required fields' });

    // find user by email
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id,email,full_name')
      .eq('email', userEmail)
      .maybeSingle();

    if (userErr) return res.status(500).json({ error: 'Failed to fetch user' });
    if (!userRow) return res.status(404).json({ error: 'User not found' });

    const userId = userRow.id as string;
    const messId = callerProfile.mess_id;
    if (!messId) return res.status(400).json({ error: 'Admin is not associated with a mess' });

    const totalAmount = PLAN_PRICES[plan] || 0;
    const amountPaid = Number(paymentAmount) || 0;

    // determine payment status
    let payment_status: 'success' | 'pending' | 'due' = 'due';
    if (amountPaid === 0) payment_status = 'due';
    else if (amountPaid < totalAmount) payment_status = 'pending';
    else payment_status = 'success';

    // Check for existing membership for this user & mess
    const { data: existingMember } = await supabase
      .from('mess_members')
      .select('*')
      .eq('user_id', userId)
      .eq('mess_id', messId)
      .maybeSingle();

    let memberRecordId: string | null = null;

    if (existingMember) {
      // Update existing membership
      const { error: updErr } = await supabase
        .from('mess_members')
        .update({
          email: userRow.email,
          name: userRow.full_name || null,
          subscription_type: plan,
          joining_date: joiningDate,
          status: 'active',
          payment_status,
          advance_payment: amountPaid > 0 && amountPaid < totalAmount ? amountPaid : null,
          total_amount_due: totalAmount,
          payment_type: paymentType,
          remaining_amount: amountPaid < totalAmount ? totalAmount - amountPaid : 0
        })
        .eq('id', existingMember.id);

      if (updErr) {
        console.error('mess_members update error:', updErr);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      memberRecordId = existingMember.id;
    } else {
      // Insert new membership
      const { data: insData, error: insErr } = await supabase
        .from('mess_members')
        .insert({
          user_id: userId,
          mess_id: messId,
          email: userRow.email,
          name: userRow.full_name || null,
          subscription_type: plan,
          joining_date: joiningDate,
          status: 'active',
          payment_status,
          advance_payment: amountPaid > 0 && amountPaid < totalAmount ? amountPaid : null,
          total_amount_due: totalAmount,
          payment_type: paymentType,
          remaining_amount: amountPaid < totalAmount ? totalAmount - amountPaid : 0
        })
        .select()
        .maybeSingle();

      if (insErr) {
        console.error('mess_members insert error:', insErr);
        return res.status(500).json({ error: 'Failed to assign subscription' });
      }

      memberRecordId = insData?.id || null;
    }

    // If any payment amount provided, create a payment record
    if (amountPaid > 0) {
      const transactionId = `ADMIN-ALLOC-${Date.now()}`;
      const { error: payErr } = await supabase.from('payments').insert({
        user_id: userId,
        mess_id: messId,
        amount: amountPaid,
        payment_date: new Date().toISOString(),
        status: payment_status,
        payment_method: 'admin_allocated',
        transaction_id: transactionId,
        is_advance: amountPaid < totalAmount,
        remaining_amount: amountPaid < totalAmount ? totalAmount - amountPaid : 0,
      });

      if (payErr) console.error('payment insert error:', payErr);
    } else {
      // create a zero-amount payment record to indicate admin allocation (optional)
      await supabase.from('payments').insert({
        user_id: userId,
        mess_id: messId,
        amount: 0,
        payment_date: new Date().toISOString(),
        status: 'success',
        payment_method: 'admin_allocated',
        transaction_id: `ADMIN-ALLOC-${Date.now()}`,
        is_advance: false,
        remaining_amount: 0
      });
    }

    // Notify user
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Subscription updated by Admin',
      message: `Your subscription has been updated by admin. Plan: ${plan.replace(/_/g, ' ')}, Paid: ₹${amountPaid}`,
      type: 'info'
    });

    return res.status(200).json({ success: true, message: 'Subscription assigned/updated successfully' });
  } catch (err) {
    console.error('admin-allocate-subscription error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
