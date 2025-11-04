import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Plan prices mapping
const PLAN_PRICES: Record<string, number> = {
  full_month: 2600,
  half_month: 1300,
  double_time: 2600,
  single_time: 1500,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      requestId,
      adminId,
      action, // 'approve' or 'reject'
      adminNotes
    } = req.body;

    // Validation
    if (!requestId || !adminId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Verify admin
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('role, mess_id')
      .eq('id', adminId)
      .single();

    if (adminError || adminData?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get subscription request
    const { data: request, error: requestError } = await supabase
      .from('subscription_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Subscription request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    if (request.mess_id !== adminData.mess_id) {
      return res.status(403).json({ error: 'Not authorized for this mess' });
    }

    if (action === 'reject') {
      // Reject the request
      const { error: updateError } = await supabase
        .from('subscription_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || 'Request rejected',
          processed_by: adminId,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to reject request' });
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: '❌ Subscription Request Rejected',
        message: `Your subscription request has been rejected. ${adminNotes || ''}`,
        type: 'error'
      });

      return res.status(200).json({
        success: true,
        message: 'Request rejected successfully'
      });
    }

    // APPROVE - Create subscription with ₹0 payment
    const totalAmount = PLAN_PRICES[request.requested_plan] || 0;

    // Create mess_members record with ₹0 payment (admin bypass)
    const { data: memberData, error: memberError } = await supabase
      .from('mess_members')
      .insert({
        mess_id: request.mess_id,
        user_id: request.user_id,
        email: request.user_email,
        name: request.user_name,
        phone: request.user_phone,
        subscription_type: request.requested_plan,
        joining_date: request.requested_join_date,
        status: 'active',
        payment_status: 'success', // Admin bypass - marked as success
        total_amount_due: totalAmount,
        payment_type: 'full',
        advance_payment: null,
        remaining_amount: 0
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating mess member:', memberError);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }

    // Create payment record with ₹0 (admin approved)
    await supabase.from('payments').insert({
      mess_id: request.mess_id,
      member_id: memberData.id,
      amount: 0, // ₹0 admin-approved payment
      payment_date: new Date().toISOString(),
      status: 'success',
      payment_method: 'admin_approved',
      transaction_id: `ADMIN-${Date.now()}`,
      is_advance: false,
      remaining_amount: 0
    });

    // Update subscription request status
    await supabase
      .from('subscription_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes || 'Approved by admin with ₹0 payment',
        processed_by: adminId,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Notify user
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      title: '✅ Subscription Request Approved!',
      message: `Your subscription has been approved by admin. You now have access to ${request.requested_plan.replace(/_/g, ' ')} plan.`,
      type: 'success'
    });

    return res.status(200).json({
      success: true,
      message: 'Request approved and subscription created successfully',
      subscription: {
        id: memberData.id,
        plan: request.requested_plan,
        totalAmount: totalAmount,
        paidAmount: 0,
        approvedBy: 'admin'
      }
    });

  } catch (error) {
    console.error('Error in approve-subscription:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
