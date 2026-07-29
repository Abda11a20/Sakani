'use client';
// apps/frontend/src/app/error.tsx
import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error monitoring service in production
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
          <div className="relative flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-xl border border-red-100">
            <AlertCircle
              className="text-red-500"
              size={52}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Error code */}
        <p className="text-7xl font-black text-red-500/20 font-cairo mb-2 select-none">
          500
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold font-cairo text-slate-800 mb-3">
          حدث خطأ غير متوقع
        </h1>

        {/* Description */}
        <p className="text-slate-500 font-cairo mb-8 leading-relaxed">
          نعتذر، حدث خطأ من جانبنا. يرجى المحاولة مرة أخرى.
          <br />
          إذا استمرت المشكلة، تواصل مع فريق الدعم.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-cairo font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw size={18} />
            إعادة المحاولة
          </button>
          <a
            href="/ar"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-cairo font-semibold rounded-xl border border-slate-200 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Home size={18} />
            العودة للرئيسية
          </a>
        </div>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="mt-6 text-xs text-slate-400 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Brand mark */}
        <p className="mt-8 text-slate-400 text-sm font-cairo">
          سكني — ابحث بثقة، اسكن بأمان
        </p>
      </div>
    </div>
  );
}
