import { createPayment, createMembership } from '@/lib/supabase';

export interface PendingPayment {
  transactionId: string;
  amount: number;
  planType: string;
  joinDate: string;
  messId: string;
  userId: string;
}

export async function completePendingPayment(transactionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get pending payment details from localStorage
    const pendingPaymentStr = localStorage.getItem('pendingPayment');
    if (!pendingPaymentStr) {
      return { success: false, error: 'No pending payment found' };
    }

    const pendingPayment: PendingPayment = JSON.parse(pendingPaymentStr);
    
    if (pendingPayment.transactionId !== transactionId) {
      return { success: false, error: 'Transaction ID mismatch' };
    }

    // Create payment record in database
    const payRes = await createPayment(
      pendingPayment.userId, 
      pendingPayment.messId, 
      pendingPayment.amount, 
      pendingPayment.planType
    );
    
    if (payRes.error) {
      throw new Error(payRes.error.message);
    }

    // Calculate expiry date
    const join = new Date(pendingPayment.joinDate);
    const expiry = new Date(join.getTime());
    if (pendingPayment.planType === 'half_month') {
      expiry.setDate(expiry.getDate() + 15);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    // Create membership record
    const memRes = await createMembership(
      pendingPayment.userId,
      pendingPayment.messId,
      pendingPayment.planType,
      pendingPayment.joinDate,
      expiry.toISOString().split('T')[0]
    );

    if (memRes.error) {
      throw new Error(memRes.error.message);
    }

    // Clear pending payment from localStorage
    localStorage.removeItem('pendingPayment');

    return { success: true };
  } catch (error) {
    console.error('Payment completion error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}