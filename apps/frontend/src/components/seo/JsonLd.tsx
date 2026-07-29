// apps/frontend/src/components/seo/JsonLd.tsx
import React from "react";

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * مكوّن عام وآمن لإدراج بيانات Schema.org (JSON-LD) في الـ DOM.
 * يستبدل علامة `<` بـ `\u003c` للحماية من هجمات XSS.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
