"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface BannedWord {
  id: string;
  phrase: string;
  normalized: string;
  type: "BLACKLIST" | "PHRASE" | "WHITELIST";
  severity: "LOW" | "MEDIUM" | "HIGH";
  description?: string;
  createdAt: string;
}

export default function BannedWordsAdminPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>("ALL");

  // Form states
  const [newPhrase, setNewPhrase] = useState("");
  const [newType, setNewType] = useState<"BLACKLIST" | "PHRASE" | "WHITELIST">("BLACKLIST");
  const [newSeverity, setNewSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("HIGH");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/banned-words");
      setWords(res.data || []);
    } catch {
      setMsg({ text: "تعذر تحميل البيانات الحالية", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;

    setIsSubmitting(true);
    setMsg(null);
    try {
      const res = await api.post("/admin/banned-words", {
        phrase: newPhrase.trim(),
        type: newType,
        severity: newSeverity,
        description: newDesc.trim() || undefined,
      });

      const added = res.data || {
        id: `custom-${Date.now()}`,
        phrase: newPhrase.trim(),
        normalized: newPhrase.trim(),
        type: newType,
        severity: newSeverity,
        description: newDesc.trim() || "تمت الإضافة بنجاح",
        createdAt: new Date().toISOString(),
      };

      setWords((prev) => [added, ...prev]);
      setMsg({ text: "تمت إضافة الكلمة إلى فلتر المحظورات بنجاح", type: "success" });
      setNewPhrase("");
      setNewDesc("");
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || "فشل إضافة العبارة", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/banned-words/${id}`);
      setWords((prev) => prev.filter((w) => w.id !== id));
      setMsg({ text: "تم حذف العبارة بنجاح", type: "success" });
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || "فشل الحذف", type: "error" });
    }
  };

  const filteredWords = words.filter((w) =>
    activeType === "ALL" ? true : w.type === activeType
  );

  return (
    <div className="w-full space-y-4 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b pb-3 border-border">
        <h1 className="text-xl font-extrabold text-text font-cairo">
          إدارة الكلمات المحظورة
        </h1>
        <span className="px-3 py-1 bg-surface-tertiary text-text-secondary text-xs font-bold rounded-xl font-cairo border border-border">
          إجمالي الكلمات: {words.length}
        </span>
      </div>

      {/* Message Banner */}
      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border font-cairo ${
            msg.type === "success"
              ? "bg-status-success/15 text-status-success border-status-success/30"
              : "bg-status-danger/15 text-status-danger border-status-danger/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleAddWord} className="bg-surface p-4 rounded-2xl border border-border shadow-xs space-y-3 font-cairo">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-text block">
              العبارة أو الكلمة *
            </label>
            <input
              type="text"
              required
              placeholder="أدخل الكلمة المراد حظرها..."
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 h-10 text-xs font-semibold text-text focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-cairo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text block">
              نوع الفلتر *
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 h-10 text-xs font-semibold text-text focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-cairo"
            >
              <option value="BLACKLIST">كلمة صريحة (Blacklist)</option>
              <option value="PHRASE">عبارة حساسة (Phrase)</option>
              <option value="WHITELIST">سياق مسموح (Whitelist)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text block">
              درجة الخطورة *
            </label>
            <select
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as any)}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3 h-10 text-xs font-semibold text-text focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-cairo"
            >
              <option value="HIGH">عالي (رفض مباشر)</option>
              <option value="MEDIUM">متوسط (مراجعة)</option>
              <option value="LOW">منخفض (تحذير)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-hover text-white font-bold px-6 h-10 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 font-cairo cursor-pointer"
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ الكلمة"}
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto font-cairo">
        {["ALL", "BLACKLIST", "PHRASE", "WHITELIST"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 font-cairo ${
              activeType === t
                ? "bg-[#0EA5E9] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {t === "ALL" && "الكل"}
            {t === "BLACKLIST" && "كلمات صريحة"}
            {t === "PHRASE" && "عبارات حساسة"}
            {t === "WHITELIST" && "سياقات مسموح بها"}
          </button>
        ))}
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-cairo">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold font-cairo">
            جاري تحميل الكلمات المحظورة...
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold font-cairo">
            لا توجد كلمات مسجلة في هذا التصنيف حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold font-cairo">
                <tr>
                  <th className="p-3 text-right whitespace-nowrap font-cairo font-bold text-xs">الكلمة</th>
                  <th className="p-3 text-right whitespace-nowrap font-cairo font-bold text-xs">نوع الفلتر</th>
                  <th className="p-3 text-right whitespace-nowrap font-cairo font-bold text-xs">درجة الخطورة</th>
                  <th className="p-3 text-left whitespace-nowrap font-cairo font-bold text-xs">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-cairo">
                {filteredWords.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-extrabold text-slate-900 font-cairo text-sm">{w.phrase}</td>
                    <td className="p-3 font-bold text-slate-600 font-cairo text-xs">
                      {w.type === "BLACKLIST" && "كلمة صريحة"}
                      {w.type === "PHRASE" && "عبارة حساسة"}
                      {w.type === "WHITELIST" && "سياق مسموح"}
                    </td>
                    <td className="p-3 font-bold text-slate-600 font-cairo text-xs">
                      {w.severity === "HIGH" && "عالي"}
                      {w.severity === "MEDIUM" && "متوسط"}
                      {w.severity === "LOW" && "منخفض"}
                    </td>
                    <td className="p-3 text-left">
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="حذف الكلمة"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
