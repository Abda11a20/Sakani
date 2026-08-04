'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Bug, Play, Loader2, CheckCircle2, AlertTriangle,
  ChevronDown, Target, ShieldAlert, XCircle, Filter,
} from 'lucide-react';

const PLACEMENT_KEYS = [
  { value: 'HOME_HERO',       label: 'البانر الرئيسي (HOME_HERO)' },
  { value: 'SEARCH_AFTER_8', label: 'صفحة البحث (SEARCH_AFTER_8)' },
  { value: 'SEARCH_BOTTOM',  label: 'أسفل البحث (SEARCH_BOTTOM)' },
  { value: 'INTERSTITIAL',   label: 'الشاشة الكاملة (INTERSTITIAL)' },
  { value: 'COMMUNITY_TOP',  label: 'أعلى مجتمع سكني (COMMUNITY_TOP)' },
];

const CATEGORIES = [
  { value: '',             label: 'جميع التصنيفات' },
  { value: 'REAL_ESTATE',  label: 'عقارات وتشطيبات' },
  { value: 'FURNITURE',    label: 'ديكور وأثاث' },
  { value: 'RESTAURANTS',  label: 'مطاعم وكافيهات' },
  { value: 'BANKS',        label: 'بنوك وخدمات مالية' },
  { value: 'SERVICES',     label: 'خدمات وصيانة' },
];

function SelectField({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-secondary mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-border px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-primary bg-surface pr-8 text-text"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute left-2.5 top-3 text-text-tertiary pointer-events-none" />
      </div>
    </div>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-surface-secondary space-y-0.5">
      <p className="text-[10px] font-bold text-text-tertiary">{label}</p>
      <p className="text-sm font-black" style={{ color }}>{value}</p>
    </div>
  );
}

export default function AdminAdsDebugPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'super_admin';

  const [placementKey, setPlacementKey] = useState('HOME_HERO');
  const [category, setCategory]         = useState('');
  const [userRole, setUserRole]         = useState('ALL');
  const [deviceTarget, setDeviceTarget] = useState('ALL');
  const [isLoading, setIsLoading]       = useState(false);
  const [debugResult, setDebugResult]   = useState<any>(null);

  const handleRun = async () => {
    setIsLoading(true);
    try {
      const params: any = { placementKey };
      if (category)               params.category     = category;
      if (userRole !== 'ALL')     params.userRole     = userRole;
      if (deviceTarget !== 'ALL')  params.deviceTarget = deviceTarget;
      const res = await api.get('/admin/ads/debug', { params });
      setDebugResult(res.data);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء فحص محرك الإعلانات');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4 font-cairo" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-status-danger/10 border border-status-danger/20 flex items-center justify-center mx-auto text-status-danger">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-text">غير مصرح بالوصول (403 Forbidden)</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          هذه الصفحة مخصصة حصرياً للسوبر أدمن لفحص شروط مطابقة واستبعاد الإعلانات.
        </p>
      </div>
    );
  }

  const matched = debugResult?.status === 'SUCCESS_MATCHED';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-cairo" dir="rtl">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-text via-primary/80 to-primary p-6 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
            <Bug size={24} className="text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-white text-lg">أداة الفحص وتشخيص استبعاد الإعلانات</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              اختبار شروط المطابقة المباشرة وتحليل أسباب استبعاد الإعلانات بالتفصيل
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls Form ── */}
      <Card variant="default" className="p-5 space-y-4">
        <h3 className="text-xs font-black text-text border-b border-border pb-3 flex items-center gap-2">
          <Filter size={15} className="text-primary" />
          مُحاكي الفحص وشروط المطابقة
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField
            label="المكان الإعلاني *"
            value={placementKey}
            onChange={setPlacementKey}
            options={PLACEMENT_KEYS}
          />
          <SelectField
            label="تصنيف النشاط"
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
          />
          <SelectField
            label="نوع المستخدم المستهدف"
            value={userRole}
            onChange={setUserRole}
            options={[
              { value: 'ALL',      label: 'الجميع (ALL)' },
              { value: 'TENANT',   label: 'مستأجرين (TENANT)' },
              { value: 'LANDLORD', label: 'مؤجرين / ملاك (LANDLORD)' },
            ]}
          />
          <SelectField
            label="نوع الجهاز المستهدف"
            value={deviceTarget}
            onChange={setDeviceTarget}
            options={[
              { value: 'ALL',     label: 'جميع الأجهزة (ALL)' },
              { value: 'DESKTOP', label: 'كمبيوتر مكتبي (DESKTOP)' },
              { value: 'MOBILE',  label: 'هواتف ذكية (MOBILE)' },
            ]}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isLoading ? 'جاري الفحص...' : 'تشغيل محاكاة المحرك'}
          </button>
        </div>
      </Card>

      {/* ── Results Section ── */}
      {debugResult && (
        <div className="space-y-5">
          {/* Decision Banner */}
          <div
            className={`rounded-2xl border p-5 ${
              matched
                ? 'bg-status-success/5 border-status-success/30'
                : 'bg-status-warning/5 border-status-warning/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                {matched ? (
                  <CheckCircle2 size={20} className="text-status-success" />
                ) : (
                  <AlertTriangle size={20} className="text-status-warning" />
                )}
                <span
                  className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    matched
                      ? 'bg-status-success/10 text-status-success border-status-success/30'
                      : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                  }`}
                >
                  الحالة: {debugResult.status}
                </span>
              </div>
              <span className="text-xs text-text-secondary font-medium">
                إجمالي المفحوصة:&nbsp;
                <strong className="text-text">{debugResult.candidatesEvaluated ?? debugResult.evaluatedCandidates?.length ?? 0}</strong>
                &nbsp;|&nbsp;المطابقة للشروط:&nbsp;
                <strong className="text-text">
                  {debugResult.evaluatedCandidates?.filter((c: any) => c.isEligible).length ?? 0}
                </strong>
              </span>
            </div>

            {debugResult.selectedAd ? (
              <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-primary" />
                    <h4 className="font-black text-sm text-text">
                      الإعلان الفائز بالعرض: {debugResult.selectedAd.title}
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-secondary text-primary border border-border">
                    الوزن الذكي: {debugResult.selectedAd.metrics?.smartScore}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricBadge label="العميل" value={debugResult.selectedAd.clientName} color="var(--color-text)" />
                  <MetricBadge label="كود الحملة" value={debugResult.selectedAd.campaignCode} color="var(--color-primary)" />
                  <MetricBadge label="نسبة التفاعل CTR" value={`${debugResult.selectedAd.metrics?.ctrPercent}`} color="var(--color-status-success)" />
                  <MetricBadge label="الوزن الديناميكي" value={debugResult.selectedAd.metrics?.dynamicWeight} color="var(--color-text)" />
                </div>
              </div>
            ) : (
              <div className="text-center py-3 space-y-1">
                <p className="font-bold text-sm text-status-warning">
                  لم يتم اختيار أي إعلان لهذا المكان
                </p>
                <p className="text-xs text-text-secondary">
                  سبب عدم الظهور: لا توجد إعلانات مطابقة لشروط النشر والمكان والمستهدفات كلياً
                </p>
              </div>
            )}
          </div>

          {/* Candidates Exclusion Breakdown Table */}
          {debugResult.evaluatedCandidates && debugResult.evaluatedCandidates.length > 0 && (
            <Card variant="default" className="p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-black text-text border-b border-border pb-3 flex items-center gap-2">
                <Bug size={15} className="text-primary" />
                تفكيك كافة الإعلانات المرشحة وأسباب الاستبعاد التفصيلية
              </h3>

              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-xs text-right">
                  <thead className="bg-surface-secondary border-b border-border text-text-secondary font-bold">
                    <tr>
                      <th className="p-3">الإعلان والحملة</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3 text-center">النتيجة</th>
                      <th className="p-3">أسباب الاستبعاد أو التأهيل</th>
                      <th className="p-3 text-center">CTR Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {debugResult.evaluatedCandidates.map((cand: any) => (
                      <tr key={cand.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-text block">{cand.title}</span>
                          <span className="text-[11px] font-mono text-primary block">{cand.campaignCode}</span>
                        </td>
                        <td className="p-3 text-text-secondary">{cand.clientName}</td>
                        <td className="p-3 text-center">
                          {cand.isEligible ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 size={11} /> مؤهل
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="gap-1">
                              <XCircle size={11} /> مستبعد
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {cand.isEligible ? (
                            <span className="text-status-success font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> مطابق لكافة شروط النشر والمكان والمستهدفات
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {cand.exclusionReasons && cand.exclusionReasons.length > 0 ? (
                                cand.exclusionReasons.map((reason: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-danger/10 text-status-danger border border-status-danger/20"
                                  >
                                    ❌ {reason}
                                  </span>
                                ))
                              ) : (
                                <span className="text-text-tertiary">غير مطيع لشروط المكان</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-text">
                          {cand.metrics?.ctrPercent || '0.00%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
