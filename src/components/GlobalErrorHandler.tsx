'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Suppress "Failed to fetch" errors from console
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';
      
      // Filter out network-related errors that are handled gracefully
      if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('UND_ERR_CONNECT_TIMEOUT')
      ) {
        // Silently ignore these errors - they're handled in the application
        return;
      }
      
      // Log all other errors normally
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
