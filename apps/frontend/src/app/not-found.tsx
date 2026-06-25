// apps/frontend/src/app/not-found.tsx
"use client";

import React from "react";

export default function GlobalNotFound() {
  return (
    <html lang="ar">
      <head>
        <title>الصفحة غير موجودة - 404</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="m-0 p-0 font-sans antialiased bg-[#0F1A2E] text-white flex items-center justify-center min-h-screen text-center">
        <div className="max-w-md px-6">
          <h1 className="text-8xl font-black text-[#D4A847] m-0">404</h1>
          <h2 className="text-2xl font-bold mt-4 mb-2">عذراً، هذه الصفحة غير موجودة!</h2>
          <p className="text-white/60 mb-8 text-sm">
            ربما تم نقل الصفحة، أو أنك استخدمت رابطاً غير صحيح. يرجى العودة للصفحة الرئيسية.
          </p>
          <a
            href="/ar"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-95 bg-[#D4A847] text-[#0F1A2E]"
          >
            العودة للرئيسية
          </a>
        </div>
      </body>
    </html>
  );
}
