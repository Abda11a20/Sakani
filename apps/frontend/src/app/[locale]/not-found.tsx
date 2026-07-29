// apps/frontend/src/app/not-found.tsx
import Link from "next/link";
import { Home, Search, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse" />
          <div className="relative flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-xl border border-blue-100">
            <MapPin
              className="text-blue-600"
              size={52}
              strokeWidth={1.5}
            />
            <span className="absolute -top-1 -right-1 text-2xl">❓</span>
          </div>
        </div>

        {/* Error code */}
        <p className="text-7xl font-black text-blue-600/20 font-cairo mb-2 select-none">
          404
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold font-cairo text-slate-800 mb-3">
          الصفحة غير موجودة
        </h1>

        {/* Description */}
        <p className="text-slate-500 font-cairo mb-8 leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
          <br />
          تحقق من الرابط أو ابدأ من الصفحة الرئيسية.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/ar"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-cairo font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Home size={18} />
            العودة للرئيسية
          </Link>
          <Link
            href="/ar/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-cairo font-semibold rounded-xl border border-slate-200 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Search size={18} />
            البحث عن سكن
          </Link>
        </div>

        {/* Brand mark */}
        <p className="mt-12 text-slate-400 text-sm font-cairo">
          سكني — ابحث بثقة، اسكن بأمان
        </p>
      </div>
    </div>
  );
}
