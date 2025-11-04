import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

type SubscriptionType = 'full_month' | 'half_month' | 'single_morning' | 'single_evening' | 'double_time';
type PaymentStatus = 'success' | 'due' | 'pending' | 'failed';

type MemberResponse = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
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

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const { data: userData, error: userError } = await adminClient.auth.getUser(token as string);
    if (userError || !userData?.user) {
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
      const paymentStatus = member.payment_status as PaymentStatus;
      const userInfo = (member as any).users;

      const userId = member.user_id;
      const paymentInfo = userId ? paymentsByUser[userId] : undefined;
      const derivedStatus: 'active' | 'inactive' | 'pending' = !member.is_active
        ? 'inactive'
        : paymentStatus === 'due' || paymentStatus === 'pending'
          ? 'pending'
          : 'active';

      const advancePayment = Number(member.advance_payment) || 0;
      const totalAmountDue = Number(member.total_amount_due) || 0;
      const remainingAmount = totalAmountDue - advancePayment;

      return {
        id: member.id,
        name: userInfo?.name || 'Member',
        email: null, // Users table doesn't have email column
        phone: userInfo?.mobile_number ?? null,
        photo_url: userInfo?.photo_url ?? null,
        plan: subscription_type,
        joinDate: member.joining_date ?? new Date().toISOString().split('T')[0],
        expiryDate: member.expiry_date ?? null,
        status: derivedStatus,
        paymentStatus,
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
