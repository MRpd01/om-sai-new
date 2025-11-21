import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

type SubscriptionType = 'full_month' | 'half_month' | 'single_morning' | 'single_evening' | 'double_time';
type PaymentStatus = 'success' | 'due' | 'pending' | 'failed';

type MemberResponse = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  parent_mobile: string | null;
  photo_url: string | null;
  plan: SubscriptionType;
  joinDate: string;
  expiryDate: string | null;
  status: 'active' | 'inactive' | 'pending';
  paymentStatus: PaymentStatus;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  advancePayment?: number;
  totalAmountDue?: number;
  remainingAmount?: number;
};

type ApiResponse = {
  success: true;
  members: MemberResponse[];
} | {
  success: false;
  error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ success: false, error: 'Server not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing access token' });
  }

  // Helper function to retry auth operations
  async function authWithRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Only retry on network/timeout errors
        const isRetryable = error?.status === 0 || 
                           error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                           error?.message?.includes('fetch failed') ||
                           error?.message?.includes('timeout');
        
        if (isRetryable && attempt < maxRetries - 1) {
          const waitTime = 1000 * (attempt + 1); // 1s, 2s
          console.warn(`⚠️ Auth retry ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'Connection': 'keep-alive'
      }
    }
  });

  try {
    const { data: userData, error: userError } = await authWithRetry(() => 
      adminClient.auth.getUser(token as string)
    );
    
    if (userError || !userData?.user) {
      console.error('Auth error:', userError);
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const callerId = userData.user.id;

    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('role, mess_id')
      .eq('id', callerId)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }

    if (!callerProfile || callerProfile.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only mess owners can view members' });
    }

    if (!callerProfile.mess_id) {
      return res.status(400).json({ success: false, error: 'Admin is not associated with any mess' });
    }

    const messId = callerProfile.mess_id;

    const { data: memberRows, error: membersError } = await adminClient
      .from('mess_members')
      .select(`
        id,
        subscription_type,
        payment_status,
        joining_date,
        expiry_date,
        is_active,
        created_at,
        user_id,
        advance_payment,
        total_amount_due,
        payment_type,
        users!mess_members_user_id_fkey (
          id,
          name,
          mobile_number,
          parent_mobile,
          photo_url
        )
      `)
      .eq('mess_id', messId)
      .order('created_at', { ascending: false });

    if (membersError) {
      return res.status(500).json({ success: false, error: membersError.message || 'Failed to load members' });
    }

    const userIds = (memberRows || [])
      .map((member) => member.user_id)
      .filter((id): id is string => Boolean(id));

    // Fetch auth emails for all users
    const emailsByUserId: Record<string, string> = {};
    
    if (userIds.length > 0) {
      try {
        // Get emails from auth.users for all member users
        const { data: authUsers } = await adminClient.auth.admin.listUsers();
        if (authUsers?.users) {
          for (const authUser of authUsers.users) {
            if (userIds.includes(authUser.id)) {
              emailsByUserId[authUser.id] = authUser.email || '';
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch auth emails:', error);
      }
    }

    const paymentsByUser: Record<string, { created_at: string; amount: number; status: PaymentStatus }> = {};

    if (userIds.length > 0) {
      const { data: paymentRows, error: paymentsError } = await adminClient
        .from('payments')
        .select('user_id, amount, created_at, status')
        .in('user_id', userIds)
        .eq('mess_id', messId)
        .order('created_at', { ascending: false });

      if (!paymentsError && paymentRows) {
        for (const payment of paymentRows) {
          const userId = payment.user_id;
          if (!userId) continue;

          if (!paymentsByUser[userId]) {
            paymentsByUser[userId] = {
              created_at: payment.created_at,
              amount: Number(payment.amount ?? 0),
              status: payment.status as PaymentStatus,
            };
          }
        }
      }
    }

    const members: MemberResponse[] = (memberRows || []).map((member) => {
      const subscription_type = member.subscription_type as SubscriptionType;
      const userInfo = (member as any).users;

      const userId = member.user_id;
      const paymentInfo = userId ? paymentsByUser[userId] : undefined;
      
      const advancePayment = Number(member.advance_payment) || 0;
      const totalAmountDue = Number(member.total_amount_due) || 0;
      const remainingAmount = totalAmountDue - advancePayment;

      // Determine status and payment status based on payment and expiry date:
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const expiryDate = member.expiry_date ? new Date(member.expiry_date) : null;
      const isExpired = expiryDate ? expiryDate < today : false;

      // Determine payment status based on payment completion and expiry
      let calculatedPaymentStatus: PaymentStatus;
      
      if (remainingAmount <= 0 && !isExpired) {
        // Full payment made and not expired
        calculatedPaymentStatus = 'success';
      } else if (advancePayment > 0 && remainingAmount > 0 && !isExpired) {
        // Partial payment (advance) and not expired
        calculatedPaymentStatus = 'pending';
      } else if (isExpired || (!member.is_active && remainingAmount > 0)) {
        // Subscription expired OR member inactive with unpaid amount
        calculatedPaymentStatus = 'due';
      } else if (!isExpired && remainingAmount > 0 && member.is_active) {
        // Not expired but has remaining amount - still pending/due
        calculatedPaymentStatus = advancePayment > 0 ? 'pending' : 'due';
      } else {
        calculatedPaymentStatus = 'due';
      }

      // Determine member status
      let derivedStatus: 'active' | 'inactive' | 'pending';
      
      if (!member.is_active || isExpired) {
        // Member is not active OR subscription has expired
        derivedStatus = 'inactive';
      } else if (calculatedPaymentStatus === 'success') {
        // Full payment made and not expired
        derivedStatus = 'active';
      } else if (calculatedPaymentStatus === 'pending') {
        // Partial payment (advance) and not expired
        derivedStatus = 'pending';
      } else {
        // No payment made and not expired
        derivedStatus = 'inactive';
      }

      return {
        id: member.id,
        userId: member.user_id,
        name: userInfo?.name || 'Member',
        email: emailsByUserId[member.user_id] || null,
        phone: userInfo?.mobile_number ?? null,
        parent_mobile: userInfo?.parent_mobile ?? null,
        photo_url: userInfo?.photo_url ?? null,
        plan: subscription_type,
        joinDate: member.joining_date ?? new Date().toISOString().split('T')[0],
        expiryDate: member.expiry_date ?? null,
        status: derivedStatus,
        paymentStatus: calculatedPaymentStatus, // Use calculated status instead of database value
        lastPaymentDate: paymentInfo?.created_at ?? null,
        lastPaymentAmount: paymentInfo?.amount ?? null,
        advancePayment: advancePayment,
        totalAmountDue: totalAmountDue,
        remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
      };
    });

    return res.status(200).json({ success: true, members });
  } catch (error) {
    console.error('members api error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
