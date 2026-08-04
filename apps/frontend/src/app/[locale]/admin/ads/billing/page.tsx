'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardsSkeleton, TableSkeleton } from '@/features/ads/admin/components/AdsSkeleton';
import { AdsErrorBoundary } from '@/features/ads/admin/components/AdsErrorBoundary';
import { useCampaigns } from '@/features/ads/hooks/useCampaigns';
import { CreditCard, Receipt, Wallet, CheckCircle2, Clock, Eye } from 'lucide-react';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'نقدي (Cash)',
  BANK_TRANSFER: 'تحويل بنكي / إنستا باي',
  INSTAPAY: 'إنستا باي',
  VODAFONE_CASH: 'فودافون كاش',
  CREDIT_CARD: 'بطاقة ائتمان',
  OTHER: 'طريقة أخرى',
};

export default function AdsBillingPage() {
  const locale = useLocale();
  const { campaigns, isLoading } = useCampaigns();

  // Financial Statistics Calculation from Live Campaigns
  const financialStats = useMemo(() => {
    let totalCollected = 0;
    let totalPending = 0;
    let paidCount = 0;

    campaigns.forEach((c) => {
      const amount = Number(c.budget || c.price || 0);
      if (c.isPaid) {
        totalCollected += amount;
        paidCount++;
      } else {
        totalPending += amount;
      }
    });

    const paidPercentage = campaigns.length > 0 ? Math.round((paidCount / campaigns.length) * 100) : 0;

    return {
      totalCollected,
      totalPending,
      paidCount,
      paidPercentage,
      totalCount: campaigns.length,
    };
  }, [campaigns]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-cairo">
        <StatCardsSkeleton />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل قسم الفواتير والمالية">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-cairo" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-text via-primary/80 to-primary p-6 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <CreditCard size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">سجل الفواتير والأنشطة المالية</h1>
              <p className="text-xs text-white/70 mt-1">
                تتبع المعاملات المالية المباشرة وتفاصيل سداد الميزانيات واشتراكات الحملات
              </p>
            </div>
          </div>
        </div>

        {/* Live Calculated Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card variant="bordered" className="p-5 space-y-1.5 border-border bg-surface">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">إجمالي التحصيلات المدفوعة</span>
              <div className="w-8 h-8 rounded-lg bg-status-success/10 flex items-center justify-center">
                <Wallet size={18} className="text-status-success" />
              </div>
            </div>
            <p className="text-2xl font-black text-primary font-mono">
              {financialStats.totalCollected.toLocaleString()} <span className="text-xs font-normal text-text-secondary">EGP</span>
            </p>
            <p className="text-[11px] text-text-tertiary">من أصل {financialStats.paidCount} حملة مدفوعة بالكامل</p>
          </Card>

          <Card variant="bordered" className="p-5 space-y-1.5 border-border bg-surface">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">فواتير بانتظار التحصيل</span>
              <div className="w-8 h-8 rounded-lg bg-status-warning/10 flex items-center justify-center">
                <Receipt size={18} className="text-status-warning" />
              </div>
            </div>
            <p className="text-2xl font-black text-text font-mono">
              {financialStats.totalPending.toLocaleString()} <span className="text-xs font-normal text-text-secondary">EGP</span>
            </p>
            <p className="text-[11px] text-text-tertiary">مستحقات معلقة لم يتم تفعيل دفعها بعد</p>
          </Card>

          <Card variant="bordered" className="p-5 space-y-1.5 border-border bg-surface">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">نسبة الحملات المدفوعة</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard size={18} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-black text-status-success font-mono">
              {financialStats.paidPercentage}%
            </p>
            <p className="text-[11px] text-text-tertiary">{financialStats.paidCount} مدفوعة من أصل {financialStats.totalCount} حملة</p>
          </Card>
        </div>

        {/* Live Financial Invoices & Transactions Table */}
        <Card variant="default" className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-text">سجل الفواتير والمعاملات المالية</h3>
            </div>
            <span className="text-xs text-text-tertiary font-mono">إجمالي الفواتير: {campaigns.length}</span>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs text-right">
              <thead className="bg-surface-secondary border-b border-border text-text-secondary font-bold">
                <tr>
                  <th className="p-3.5">كود الفاتورة</th>
                  <th className="p-3.5">اسم الحملة والعميل</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">حالة التحصيل</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {campaigns.length > 0 ? (
                  campaigns.map((c) => {
                    const amount = Number(c.budget || c.price || 0);
                    return (
                      <tr key={c.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">
                          <Link href={`/${locale}/admin/ads/campaigns/${c.id}`} className="hover:underline">
                            {c.campaignCode}
                          </Link>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-text block">{c.name}</span>
                          <span className="text-[11px] text-text-tertiary block">العميل: {c.clientName}</span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-text">
                          {amount > 0 ? `${amount.toLocaleString()} EGP` : 'غير محدد'}
                        </td>
                        <td className="p-3.5 text-text-secondary">
                          {c.paymentMethod && PAYMENT_METHOD_LABELS[c.paymentMethod]
                            ? PAYMENT_METHOD_LABELS[c.paymentMethod]
                            : 'نقدي (Cash)'}
                        </td>
                        <td className="p-3.5">
                          {c.isPaid ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 size={11} /> مدفوعة
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="gap-1">
                              <Clock size={11} /> معلقة
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-text-tertiary">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG') : '—'}
                        </td>
                        <td className="p-3.5 text-center">
                          <Link href={`/${locale}/admin/ads/campaigns/${c.id}`}>
                            <Button variant="ghost" size="sm" className="p-1 text-primary">
                              <Eye size={14} />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-tertiary">
                      لا توجد فواتير أو معاملة مالية مسجلة بالنظام حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdsErrorBoundary>
  );
}
