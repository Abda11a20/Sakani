// apps/frontend/src/app/loading.tsx
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-6">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        {/* Spinning arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Brand */}
      <p className="text-xl font-bold font-cairo text-blue-600 tracking-wide mb-1">
        سكني
      </p>
      <p className="text-sm text-slate-400 font-cairo animate-pulse">
        جاري التحميل...
      </p>
    </div>
  );
}
