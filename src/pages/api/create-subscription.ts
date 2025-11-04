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
      userId,
      email,
      plan,
      joiningDate,
      paymentType,
      paymentAmount,
      totalAmountDue
    } = req.body;

    // Validation
    if (!userId || !email || !plan || !joiningDate || !paymentType || !paymentAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate payment amount
    if (paymentAmount < 500) {
      return res.status(400).json({ error: 'Minimum payment amount is ₹500' });
    }

    const expectedTotal = PLAN_PRICES[plan] || totalAmountDue;
    if (paymentAmount > expectedTotal) {
      return res.status(400).json({ error: `Payment amount cannot exceed ₹${expectedTotal}` });
    }

    // Get user's mess_id from their profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('mess_id, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    const messId = userData.mess_id;
    const fullName = userData.full_name;

    if (!messId) {
      return res.status(400).json({ error: 'User is not associated with any mess' });
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('mess_members')
      .select('id')
      .eq('mess_id', messId)
      .eq('user_id', userId)
      .single();

    if (existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Create mess_members record with payment tracking
    const isAdvance = paymentType === 'advance' && paymentAmount < expectedTotal;
    const remainingAmount = expectedTotal - paymentAmount;
    
    // Determine payment status based on payment type
    const paymentStatus = isAdvance ? 'pending' : 'success'; // 'pending' if advance payment, 'success' if full payment

    const { data: memberData, error: memberError } = await supabase
      .from('mess_members')
      .insert({
        mess_id: messId,
        user_id: userId,
        email: email,
        name: fullName,
        subscription_type: plan,
        joining_date: joiningDate,
        status: 'active',
        payment_status: paymentStatus,
        advance_payment: isAdvance ? paymentAmount : null,
        total_amount_due: expectedTotal,
        payment_type: paymentType,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating mess member:', memberError);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        mess_id: messId,
        member_id: memberData.id,
        amount: paymentAmount,
        payment_date: new Date().toISOString(),
        status: 'success',
        payment_method: 'phonepe',
        transaction_id: `SUB-${Date.now()}`, // Generate unique transaction ID
        is_advance: isAdvance,
        remaining_amount: remainingAmount > 0 ? remainingAmount : null,
      });

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      // Don't fail the whole operation if payment record fails
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: memberData.id,
        plan: plan,
        totalAmount: expectedTotal,
        paidAmount: paymentAmount,
        remainingAmount: remainingAmount,
        isAdvance: isAdvance,
      }
    });

  } catch (error) {
    console.error('Error in create-subscription:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
