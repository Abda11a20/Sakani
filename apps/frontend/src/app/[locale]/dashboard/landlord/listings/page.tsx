// apps/frontend/src/app/[locale]/dashboard/landlord/listings/page.tsx
"use client";

import React, { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMyListings, useDeleteListing } from "@/hooks/useListings";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Card, CardBody, Spinner, Button, Badge, Modal, useToast } from "@/components/ui";
import {
  Building,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Bed,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

type FilterStatus = "all" | "active" | "pending_review" | "rented";

const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  room: "غرفة",
  bed: "سرير",
};

export default function LandlordListings() {
  const locale = useLocale();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "landlord" });
  const { data: listings = [], isLoading: isListingsLoading } = useMyListings();
  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAuthOrListingsLoading = isAuthLoading || isListingsLoading;

  if (isAuthOrListingsLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Filter listings
  const filteredListings = listings.filter((item) => {
    if (activeFilter === "all") return true;
    return item.status === activeFilter;
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deleteListing(deleteId, {
      onSuccess: () => {
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف الإعلان بنجاح من المنصة.",
          type: "success",
        });
        setDeleteId(null);
      },
      onError: () => {
        toast({
          title: "فشل الحذف",
          description: "حدث خطأ أثناء محاولة حذف الإعلان. حاول مرة أخرى.",
          type: "error",
        });
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">نشط</Badge>;
      case "pending_review":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">قيد المراجعة</Badge>;
      case "rented":
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400 font-normal">مؤجر</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400">{status}</Badge>;
    }
  };

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cairo">إعلاناتي</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo">
              أضف عقارات جديدة أو عدل العقارات المنشورة بالفعل وتتبع إشغالها.
            </p>
          </div>
          <Link href={`/${locale}/dashboard/landlord/listings/add`}>
            <Button className="font-cairo flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-6 px-6 shadow-sm">
              <Plus size={18} />
              <span>إضافة إعلان جديد</span>
            </Button>
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {(
            [
              { key: "all", label: "الكل" },
              { key: "active", label: "نشط" },
              { key: "pending_review", label: "قيد المراجعة" },
              { key: "rented", label: "مؤجر" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium font-cairo transition-all duration-200 ${
                activeFilter === filter.key
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl font-cairo">
            <Building size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">لا توجد إعلانات</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto text-sm">
              {activeFilter === "all"
                ? "لم تقم بنشر أي عقارات بعد. ابدأ بإضافة عقارك الأول الآن!"
                : "لا توجد عقارات تطابق حالة التصفية المحددة."}
            </p>
            {activeFilter === "all" && (
              <Link href={`/${locale}/dashboard/landlord/listings/add`} className="inline-block mt-6">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6 py-2.5">
                  إضافة إعلانك الأول
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => {
              const totalBeds = item.beds?.length ?? 0;
              const rentedBeds = item.beds?.filter((b) => !b.isAvailable).length ?? 0;

              return (
                <Card
                  key={item.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full bg-white dark:bg-slate-900"
                >
                  {/* Listing Image & Badges */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                    <img
                      src={item.images[0] || "/placeholder-listing.jpg"}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      {getStatusBadge(item.status)}
                      <Badge className="bg-amber-500 text-white font-semibold">
                        {TYPE_LABELS[item.type] || item.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Body */}
                  <CardBody className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate font-cairo">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-2">
                        <MapPin size={14} className="text-amber-500" />
                        <span className="text-xs truncate font-cairo">
                          {item.district}، {item.city}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400 font-sans">
                          {new Intl.NumberFormat("ar-EG").format(item.price)}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs font-cairo">
                          جنيه/شهر
                        </span>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      {/* Bed info or Views */}
                      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-cairo">
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{item.views || 0} مشاهدة</span>
                        </div>
                        {item.type === "bed" && (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <Bed size={14} />
                            <span>
                              {rentedBeds}/{totalBeds} سرير مؤجر
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/${locale}/listings/${item.id}`} target="_blank">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-cairo rounded-xl"
                          >
                            <Eye size={13} />
                            <span>عرض</span>
                          </Button>
                        </Link>
                        <Link href={`/${locale}/dashboard/landlord/listings/${item.id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-cairo rounded-xl"
                          >
                            <Edit2 size={13} />
                            <span>تعديل</span>
                          </Button>
                        </Link>
                        {item.type === "bed" && (
                          <Link href={`/${locale}/dashboard/landlord/beds?listingId=${item.id}`} className="col-span-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-cairo rounded-xl border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            >
                              <Bed size={13} />
                              <span>إدارة الأسرة ({totalBeds})</span>
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(item.id)}
                          className="w-full col-span-2 md:col-span-2 flex items-center justify-center gap-1.5 py-2 text-xs text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 font-cairo rounded-xl"
                        >
                          <Trash2 size={13} />
                          <span>حذف</span>
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <Modal
            isOpen={true}
            onClose={() => setDeleteId(null)}
            title="تأكيد حذف الإعلان"
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                هل أنت متأكد من حذف هذا الإعلان؟
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع الصور والبيانات المتعلقة بهذا العقار نهائياً.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setDeleteId(null)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800 font-semibold"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3"
                >
                  {isDeleting ? "جاري الحذف..." : "حذف الإعلان"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </LandlordLayout>
  );
}
