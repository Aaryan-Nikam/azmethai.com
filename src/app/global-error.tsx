'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-lg bg-white rounded-2xl shadow-xl border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Critical System Error</h2>
          <p className="text-gray-500 mb-8">
            The application experienced a critical fault rendering the root layout. 
            This has been reported.
          </p>
          <button
            onClick={() => {
               // Global error requires full reload in Next.js
               window.location.reload();
            }}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            Refresh Dashboard
          </button>
        </div>
      </body>
    </html>
  );
}
