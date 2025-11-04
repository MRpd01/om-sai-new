'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { completePendingPayment } from '@/lib/payment-utils';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [transactionId, setTransactionId] = useState<string>('');
  const [membershipCreated, setMembershipCreated] = useState<boolean>(false);

  useEffect(() => {
    const txnId = searchParams?.get('txnId');
    if (txnId) {
      setTransactionId(txnId);
      checkPaymentStatus(txnId);
    } else {
      setPaymentStatus('failed');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (txnId: string) => {
    try {
      const response = await fetch('/api/payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId: txnId }),
      });

      const data = await response.json();
      
      if (data && (data.code === 'PAYMENT_SUCCESS' || (data.success && data.data && data.data.status && data.data.status.toString().toUpperCase() === 'SUCCESS'))) {
        // Payment appears successful according to PhonePe — assume server-side webhook finalized membership
        setPaymentStatus('success');
        setMembershipCreated(true);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
      setPaymentStatus('failed');
    }
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-900">
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {paymentStatus === 'loading' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-orange-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verifying Payment...
                </h3>
                <p className="text-gray-600">
                  Please wait while we confirm your payment.
                </p>
              </div>
            </>
          )}

          {paymentStatus === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600 mb-2">
                  Your payment has been processed successfully.
                </p>
                {membershipCreated && (
                  <p className="text-green-600 mb-4">
                    ✓ Your subscription has been activated!
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Transaction ID: {transactionId}
                </p>
              </div>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Payment Failed
                </h3>
                <p className="text-gray-600 mb-4">
                  Your payment could not be processed. Please try again.
                </p>
                <p className="text-sm text-gray-500">
                  Transaction ID: {transactionId}
                </p>
              </div>
            </>
          )}

          <Button 
            onClick={handleReturnToDashboard}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="h-16 w-16 text-orange-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading payment status...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}