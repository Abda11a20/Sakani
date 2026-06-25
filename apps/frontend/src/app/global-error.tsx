'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="ar">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          color: '#0f172a'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>حدث خطأ غير متوقع في النظام</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>نعتذر عن هذا العطل المؤقت. يرجى المحاولة مرة أخرى.</p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
