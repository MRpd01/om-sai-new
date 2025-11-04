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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      plan,
      joiningDate,
      message
    } = req.body;

    console.log('Request subscription API called with:', {
      userId,
      userName,
      userEmail,
      plan,
      joiningDate
    });

    // Validation
    if (!userId || !userName || !userEmail || !plan || !joiningDate) {
      console.error('Missing required fields:', { userId, userName, userEmail, plan, joiningDate });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user's mess_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('mess_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.mess_id) {
      console.error('User not found or not assigned to mess:', userError);
      return res.status(404).json({ error: 'User not found or not assigned to a mess' });
    }

    console.log('User mess_id:', userData.mess_id);

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('mess_members')
      .select('id')
      .eq('user_id', userId)
      .eq('mess_id', userData.mess_id)
      .single();

    if (existingSubscription) {
      console.log('User already has subscription:', existingSubscription);
      return res.status(400).json({ error: 'You already have an active subscription' });
    }

    console.log('No existing subscription found, checking for pending requests...');

    // Check if user already has a pending request
    const { data: pendingRequest } = await supabase
      .from('subscription_requests')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (pendingRequest) {
      console.log('User already has pending request:', pendingRequest);
      return res.status(400).json({ error: 'You already have a pending approval request' });
    }

    console.log('Creating new subscription request...');

    // Create subscription request
    const { data: requestData, error: requestError } = await supabase
      .from('subscription_requests')
      .insert({
        user_id: userId,
        mess_id: userData.mess_id,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone || null,
        requested_plan: plan,
        requested_join_date: joiningDate,
        request_message: message || null,
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating subscription request:', requestError);
      return res.status(500).json({ 
        error: 'Failed to create subscription request',
        details: requestError.message 
      });
    }

    console.log('Subscription request created:', requestData);

    // Get all admins for this mess to notify them
    const { data: admins } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('mess_id', userData.mess_id)
      .eq('role', 'admin');

    // Create notifications for all admins
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: '🔔 New Subscription Request',
        message: `${userName} (${userEmail}) has requested subscription approval for ${plan.replace(/_/g, ' ')} plan`,
        type: 'subscription_request',
        related_id: requestData.id,
        is_read: false
      }));

      await supabase.from('notifications').insert(notifications);
      console.log(`Created ${notifications.length} admin notifications`);
    }

    console.log('Subscription request completed successfully');
    return res.status(200).json({
      success: true,
      message: 'Subscription request sent successfully. Admin will review and approve.',
      request: requestData
    });

  } catch (error: any) {
    console.error('Error in request-subscription:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error'
    });
  }
}
