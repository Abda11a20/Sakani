// apps/frontend/src/app/layout.tsx
// Root layout required by Next.js 14 App Router
// The [locale]/layout.tsx handles the actual per-locale layout

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
