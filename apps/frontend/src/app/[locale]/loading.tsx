// apps/frontend/src/app/[locale]/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-surface-secondary py-12 font-cairo">
      {/* Spinner */}
      <div className="relative w-14 h-14 mb-4">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        {/* Spinning arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
        </div>
      </div>

      {/* Brand */}
      <p className="text-lg font-bold text-primary tracking-wide mb-1">
        سكني
      </p>
      <p className="text-xs text-text-tertiary animate-pulse">
        جاري التحميل...
      </p>
    </div>
  );
}
