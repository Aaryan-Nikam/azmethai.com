'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry or Supabase Error DB
    console.error('Captured by App Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-100 m-8">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        An unexpected error occurred in this module. We've automatically logged this issue to our engineering team. 
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-md active:scale-95 font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard/leads'}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
        >
          Go to Dashboard
        </button>
      </div>

      <div className="mt-12 text-left w-full max-w-2xl">
         <details className="bg-gray-100 p-4 rounded-lg border border-gray-200 text-xs font-mono text-gray-600 cursor-pointer">
           <summary className="font-semibold mb-2 outline-none">Technical Details (For engineering)</summary>
           <p className="whitespace-pre-wrap mt-2 overflow-x-auto">{error.message}</p>
         </details>
      </div>
    </div>
  );
}
