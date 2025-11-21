import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    // Verify admin user
    const { data: userData, error: userError } = await adminClient.auth.getUser(token as string);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const callerId = userData.user.id;

    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('role, mess_id')
      .eq('id', callerId)
      .maybeSingle();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update members' });
    }

    const { 
      memberId, 
      userId,
      name, 
      email, 
      phone, 
      parent_mobile,
      plan, 
      joinDate, 
      expiryDate,
      advancePayment,
      totalAmountDue
    } = req.body;

    if (!memberId || !userId) {
      return res.status(400).json({ error: 'Missing member ID or user ID' });
    }

    // Update user profile
    const { error: userUpdateError } = await adminClient
      .from('users')
      .update({
        name: name,
        email: email,
        mobile_number: phone,
        parent_mobile: parent_mobile
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user:', userUpdateError);
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    // Calculate payment status and member status based on amounts
    const amountPaid = Number(advancePayment) || 0;
    const totalDue = Number(totalAmountDue);
    
    if (!totalDue || totalDue <= 0) {
      return res.status(400).json({ error: 'Invalid total amount due. Please specify the plan amount.' });
    }
    
    const remaining = totalDue - amountPaid;

    let paymentStatus: 'success' | 'due' | 'pending' = 'due';
    let isActive = false;

    if (amountPaid === 0) {
      paymentStatus = 'due';
      isActive = false;
    } else if (amountPaid < totalDue) {
      paymentStatus = 'pending'; // Partial payment
      isActive = true; // Still active with advance payment
    } else {
      paymentStatus = 'success'; // Full payment
      isActive = true;
    }

    // Update membership details
    const { error: memberUpdateError } = await adminClient
      .from('mess_members')
      .update({
        subscription_type: plan,
        joining_date: joinDate,
        expiry_date: expiryDate,
        advance_payment: amountPaid,
        total_amount_due: totalDue,
        payment_status: paymentStatus,
        is_active: isActive
      })
      .eq('id', memberId);

    if (memberUpdateError) {
      console.error('Error updating membership:', memberUpdateError);
      return res.status(500).json({ error: 'Failed to update membership' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Member updated successfully',
      paymentStatus: paymentStatus,
      remainingAmount: remaining > 0 ? remaining : 0
    });

  } catch (error: any) {
    console.error('Update member error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
