// apps/frontend/src/app/[locale]/dashboard/tenant/alerts/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  useMyAlerts,
  useCreateAlert,
  useUpdateAlert,
  useToggleAlert,
  useDeleteAlert,
} from "@/hooks/useAlerts";
import TenantLayout from "@/components/layout/TenantLayout";
import { Card, CardBody, Spinner, Button, Badge, Modal, Input, useToast, EmptyState } from "@/components/ui";
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  CircleDollarSign,
  User,
  GraduationCap,
  BellOff,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useLocale } from "next-intl";
import { EGYPTIAN_GOVERNORATES, UNIT_TYPE_CONFIG, GENDER_TARGET_CONFIG } from "@/lib/constants";
import { generateAlertSummary } from "@/lib/helpers";
import type { Alert, GenderTarget } from "@/types";



export default function TenantAlerts() {
  const locale = useLocale();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["tenant"] });

  // Queries & Mutations
  const { data: rawAlerts = [], isLoading: isAlertsLoading } = useMyAlerts();
  const alerts = rawAlerts || [];
  const { mutate: createAlert, isPending: isCreating } = useCreateAlert();
  const { mutate: updateAlert, isPending: isUpdating } = useUpdateAlert();
  const { mutate: toggleAlert } = useToggleAlert();
  const { mutate: deleteAlert, isPending: isDeleting } = useDeleteAlert();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);

  // Form states
  const [gov, setGov] = useState("القاهرة");
  const [district, setDistrict] = useState("");
  const [unitType, setUnitType] = useState<"apartment" | "bed">("apartment");
  const [maxPrice, setMaxPrice] = useState("");
  const [genderTarget, setGenderTarget] = useState<GenderTarget>("mixed");
  const [specialty, setSpecialty] = useState("");

  const isLoading = isAuthLoading || isAlertsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingAlert(null);
    setGov("القاهرة");
    setDistrict("");
    setUnitType("apartment");
    setMaxPrice("");
    setGenderTarget("mixed");
    setSpecialty("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert);
    setGov(alert.governorate || "القاهرة");
    setDistrict(alert.district || "");
    setUnitType(alert.unitType || "apartment");
    setMaxPrice(alert.maxPrice ? String(alert.maxPrice) : "");
    setGenderTarget(alert.genderTarget || "mixed");
    setSpecialty(alert.specialty || "");
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      governorate: gov,
      district: district || undefined,
      unitType,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      genderTarget,
      specialty: specialty || undefined,
    };

    if (editingAlert) {
      updateAlert(
        { id: editingAlert.id, data: payload },
        {
          onSuccess: () => {
            toast({
              title: "تم تعديل التنبيه",
              description: "تم تحديث مواصفات التنبيه الذكي بنجاح.",
              type: "success",
            });
            setIsFormModalOpen(false);
          },
          onError: () => {
            toast({
              title: "حدث خطأ",
              description: "فشل تحديث التنبيه. حاول مرة أخرى.",
              type: "error",
            });
          },
        }
      );
    } else {
      createAlert(payload, {
        onSuccess: () => {
          toast({
            title: "تم إنشاء التنبيه",
            description: "تم تفعيل التنبيه الذكي للمواصفات الجديدة بنجاح.",
            type: "success",
          });
          setIsFormModalOpen(false);
        },
        onError: () => {
          toast({
            title: "حدث خطأ",
            description: "فشل تفعيل التنبيه. حاول مرة أخرى.",
            type: "error",
          });
        },
      });
    }
  };

  const handleToggle = (id: string) => {
    toggleAlert(id, {
      onSuccess: (updated) => {
        toast({
          title: updated.isActive ? "تم تفعيل التنبيه" : "تم إيقاف التنبيه",
          description: updated.isActive ? "ستصلك إشعارات للمطابقات الجديدة." : "تم إيقاف إرسال إشعارات التنبيه مؤقتاً.",
          type: "success",
        });
      },
    });
  };

  const handleDeleteSubmit = () => {
    if (!deleteAlertId) return;

    deleteAlert(deleteAlertId, {
      onSuccess: () => {
        toast({
          title: "تم حذف التنبيه",
          description: "تم إزالة التنبيه الذكي بنجاح.",
          type: "success",
        });
        setDeleteAlertId(null);
      },
      onError: () => {
        toast({
          title: "حدث خطأ",
          description: "فشل حذف التنبيه. حاول مرة أخرى.",
          type: "error",
        });
      },
    });
  };

  return (
    <TenantLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cairo">تنبيهاتي الذكية</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
              نبلغك ونرسل لك إشعاراً فور إدراج عقار جديد يطابق مواصفات البحث الخاصة بك.
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="font-cairo flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 px-6 shadow-sm"
          >
            <Plus size={18} />
            <span>تنبيه جديد</span>
          </Button>
        </div>

        {/* List of Alerts */}
        {alerts.length === 0 ? (
          <EmptyState
            icon={<Bell size={48} />}
            title="لا توجد تنبيهات بعد"
            description="أنشئ تنبيهاً ذكياً لنخطرك فور نزول شقة أو سرير يناسب ميزانيتك وموقعك المفضل."
            action={
              <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5">
                أنشئ أول تنبيه
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.map((alert) => {
              const active = alert.isActive;

              return (
                <Card
                  key={alert.id}
                  className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-300 ${
                    active
                      ? "border-blue-100 dark:border-blue-900/40 bg-white dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 opacity-75"
                  }`}
                >
                  <CardBody className="p-6 space-y-4">
                    {/* Top Row: Icon + Switch */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active ? "bg-blue-500/10 text-blue-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}>
                        {active ? <Bell size={18} /> : <BellOff size={18} />}
                      </div>

                      {/* Custom Switch Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => handleToggle(alert.id)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500/30 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                      </label>
                    </div>

                    {/* Summary */}
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-cairo line-clamp-1 leading-snug">
                        {generateAlertSummary(alert)}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-cairo">
                        {active ? "تنبيه نشط - يتم فحص المطابقات" : "موقوف مؤقتاً"}
                      </p>
                    </div>

                    {/* Chips details */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {alert.governorate && (
                        <Badge variant="default" className="text-[10px] font-cairo flex items-center gap-1">
                          <MapPin size={10} />
                          <span>{alert.governorate}</span>
                        </Badge>
                      )}
                      {alert.district && (
                        <Badge variant="default" className="text-[10px] font-cairo">
                          <span>{alert.district}</span>
                        </Badge>
                      )}
                      {alert.unitType && (
                        <Badge variant="default" className="text-[10px] font-cairo bg-blue-500/5 text-blue-600 dark:text-blue-400">
                          <span>{UNIT_TYPE_CONFIG[alert.unitType as keyof typeof UNIT_TYPE_CONFIG]?.labelAr ?? alert.unitType}</span>
                        </Badge>
                      )}
                      {alert.maxPrice && (
                        <Badge variant="default" className="text-[10px] font-cairo flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CircleDollarSign size={10} />
                          <span>حد أقصى: {alert.maxPrice} ج</span>
                        </Badge>
                      )}
                      {alert.genderTarget && (
                        <Badge variant="default" className="text-[10px] font-cairo flex items-center gap-1">
                          <User size={10} />
                          <span>{GENDER_TARGET_CONFIG[alert.genderTarget as keyof typeof GENDER_TARGET_CONFIG]?.labelAr ?? alert.genderTarget}</span>
                        </Badge>
                      )}
                      {alert.specialty && (
                        <Badge variant="default" className="text-[10px] font-cairo flex items-center gap-1 bg-amber-500/5 text-amber-600">
                          <GraduationCap size={10} />
                          <span>{alert.specialty}</span>
                        </Badge>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {active && (
                        <Link
                          href={`/${locale}/search?alertId=${alert.id}`}
                          className="rounded-lg text-xs font-cairo py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Search size={12} />
                          <span>عرض المطابقات</span>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(alert)}
                        className="rounded-lg text-xs font-cairo p-2 flex items-center gap-1.5"
                      >
                        <Edit2 size={12} />
                        <span>تعديل</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteAlertId(alert.id)}
                        className="rounded-lg text-xs font-cairo p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 border-red-500/20 flex items-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        <span>حذف</span>
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Alert Create/Edit Modal */}
        {isFormModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsFormModalOpen(false)}
            title={editingAlert ? "تعديل تنبيه البحث الذكي" : "إعداد تنبيه بحث ذكي جديد"}
          >
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 font-cairo">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المحافظة</label>
                <select
                  value={gov}
                  onChange={(e) => setGov(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="الحي/المنطقة"
                placeholder="مثال: الدقي، جليم، مدينة نصر"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع الوحدة</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "apartment", label: "شقة" },
                      { key: "bed", label: "سرير" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setUnitType(opt.key)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        unitType === opt.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                type="number"
                label="الحد الأقصى للسعر"
                placeholder="مثال: 3000"
                rightIcon={<span className="text-xs font-semibold">ج.م</span>}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الفئة المستهدفة</label>
                <select
                  value={genderTarget}
                  onChange={(e) => setGenderTarget(e.target.value as any)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mixed">الجميع</option>
                  <option value="male">شباب فقط</option>
                  <option value="female">بنات فقط</option>
                </select>
              </div>

              {unitType === "bed" && (
                <Input
                  label="التخصص الدراسي / الوظيفي (اختياري)"
                  placeholder="مثال: هندسة، طب، موظف"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3"
                >
                  {isCreating || isUpdating ? "جاري الحفظ..." : "حفظ التنبيه"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Alert Delete Confirmation Modal */}
        {deleteAlertId && (
          <Modal
            isOpen={true}
            onClose={() => setDeleteAlertId(null)}
            title="تأكيد حذف التنبيه"
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                هل أنت متأكد من حذف التنبيه الذكي؟
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                لن يتم إشعارك فور إدراج مطابقات بحث جديدة بعد الحذف.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setDeleteAlertId(null)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800 font-semibold"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleDeleteSubmit}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3"
                >
                  {isDeleting ? "جاري الحذف..." : "حذف التنبيه"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </TenantLayout>
  );
}
