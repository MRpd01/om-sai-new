"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params?.get('email') ?? undefined;
  const token = params?.get('token') ?? undefined;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Email verification</h1>
        {token ? (
          <div>
            <p className="mb-4">Thank you — we received your verification request for <strong>{email}</strong>.</p>
            <p className="mb-2">This link confirms your email address for the Om Sai Bhojnalay dashboard.</p>
            <p className="text-sm text-gray-600">If you experience issues, contact the mess owner or site support (see footer).</p>
          </div>
        ) : (
          <p>No verification token provided.</p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white p-8 rounded shadow">
          <h1 className="text-2xl font-bold mb-4">Email verification</h1>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
