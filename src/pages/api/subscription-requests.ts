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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID required' });
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

    // Get all subscription requests for this mess
    const { data: requests, error: requestsError } = await supabase
      .from('subscription_requests')
      .select('*')
      .eq('mess_id', adminData.mess_id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching subscription requests:', requestsError);
      return res.status(500).json({ error: 'Failed to fetch subscription requests' });
    }

    return res.status(200).json({
      success: true,
      requests: requests || [],
      pending: requests?.filter(r => r.status === 'pending').length || 0
    });

  } catch (error) {
    console.error('Error in subscription-requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
