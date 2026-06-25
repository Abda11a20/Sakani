// apps/frontend/src/app/[locale]/listings/[id]/listing-detail-client.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  Wifi,
  Wind,
  Building2,
  BedDouble,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  Calendar,
  Zap,
  Shield,
  WashingMachine,
  Layers,
  Receipt,
  DoorOpen,
  ArrowLeft,
  UserCheck,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { ListingCard } from "@/components/listings/ListingCard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth.store";
import type { Listing, Review } from "@/types";

// ── Types ─────────────────────────────────────────────────────
interface ListingDetailClientProps {
  listing: Listing;
  reviews: Review[];
  suggested: Listing[];
  locale: string;
}

// ── Constants ─────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  room: "غرفة",
  bed: "سرير",
};

const AMENITY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  wifi: { icon: <Wifi size={16} />, label: "واي فاي" },
  ac: { icon: <Wind size={16} />, label: "تكييف" },
  elevator: { icon: <Layers size={16} />, label: "أسانسير" },
  washer: { icon: <WashingMachine size={16} />, label: "غسالة" },
  gas: { icon: <Zap size={16} />, label: "غاز" },
  security: { icon: <Shield size={16} />, label: "أمن وحراسة" },
  furnished: { icon: <BedDouble size={16} />, label: "مفروش" },
};

// ── Image Gallery ─────────────────────────────────────────────
function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const hasImages = images && images.length > 0;
  const displayImages = hasImages ? images : [];

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-4 gap-2 h-[420px]">
        {/* Main image */}
        <div
          className="col-span-4 md:col-span-2 relative overflow-hidden rounded-2xl md:rounded-e-none bg-muted cursor-pointer"
          onClick={() => { setActiveIdx(0); setLightboxOpen(true); }}
        >
          {displayImages[0] ? (
            <img
              src={displayImages[0]}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Building2 size={60} />
            </div>
          )}
        </div>

        {/* Secondary images grid */}
        <div className="hidden md:grid col-span-2 grid-rows-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`relative overflow-hidden bg-muted cursor-pointer ${
                i === 2 ? "rounded-tr-2xl" : i === 4 ? "rounded-br-2xl" : ""
              }`}
              onClick={() => { setActiveIdx(i); setLightboxOpen(true); }}
            >
              {displayImages[i] ? (
                <img
                  src={displayImages[i]}
                  alt={`${title} ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                  <Building2 size={28} />
                </div>
              )}
              {/* "View all" overlay on last visible */}
              {i === 4 && displayImages.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">+{displayImages.length - 5} صورة</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View all button */}
        {displayImages.length > 0 && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="md:hidden absolute bottom-4 end-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-sm font-semibold px-3 py-1.5 rounded-xl shadow"
          >
            عرض كل الصور ({displayImages.length})
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && displayImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button
            className="absolute top-4 end-4 text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={24} />
          </button>
          <button
            className="absolute start-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-xl transition-colors"
            onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % displayImages.length); }}
          >
            <ChevronRight size={28} />
          </button>
          <img
            src={displayImages[activeIdx]}
            alt={`${title} ${activeIdx + 1}`}
            className="max-w-4xl max-h-[80vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute end-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-xl transition-colors"
            onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + displayImages.length) % displayImages.length); }}
          >
            <ChevronLeft size={28} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeIdx + 1} / {displayImages.length}
          </div>
        </div>
      )}
    </>
  );
}

// ── Request Viewing Modal ─────────────────────────────────────
function RequestViewingModal({
  listingId,
  open,
  onClose,
}: {
  listingId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/requests", {
        listingId,
        requestedDate: new Date(`${date}T${time}`).toISOString(),
        notes: notes || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">طلب معاينة</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-xl">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">تم إرسال طلبك!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              سيتواصل معك المؤجر في أقرب وقت لتأكيد الموعد
            </p>
            <button onClick={onClose} className="btn-primary px-8 py-2.5 rounded-xl font-semibold">
              حسناً
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Calendar size={14} className="inline me-1" />
                تاريخ المعاينة
              </label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Clock size={14} className="inline me-1" />
                الوقت المناسب
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field w-full text-sm"
              >
                {["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="أي تفاصيل إضافية تريد إبلاغ المؤجر بها..."
                className="input-field w-full text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/10 transition-colors">
                إلغاء
              </button>
              <button type="submit" disabled={loading || !date} className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold">
                {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Contact Card ──────────────────────────────────────────────
function ContactCard({ listing, locale }: { listing: Listing; locale: string }) {
  const { user: currentUser } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);

  const avgRating = 4.5; // سيكون من الـ API لاحقاً

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        {/* Price */}
        <div className="text-center mb-5 pb-5 border-b border-border">
          <span className="text-3xl font-bold text-primary">
            {new Intl.NumberFormat("ar-EG").format(listing.price)}
          </span>
          <span className="text-muted-foreground text-sm"> جنيه/شهر</span>
        </div>

        {/* Landlord info */}
        {listing.landlord && (
          <div className="flex items-center gap-3 mb-5">
            <Avatar src={null} name={listing.landlord.name} size="md" verified={listing.isVerified} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{listing.landlord.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-muted-foreground">{avgRating.toFixed(1)}</span>
                {listing.isVerified && (
                  <Badge variant="success" className="text-xs px-1.5 py-0.5 ms-1">
                    <CheckCircle size={9} className="me-0.5" />
                    موثق
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Request viewing */}
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 mb-3"
        >
          <Calendar size={16} />
          طلب معاينة
        </button>

        {/* Contact info (only if logged in) */}
        {currentUser ? (
          <div className="space-y-2">
            {listing.landlord?.phone && (
              <a
                href={`tel:${listing.landlord.phone}`}
                className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted/10 transition-colors text-foreground"
              >
                <Phone size={15} className="text-primary" />
                {listing.landlord.phone}
              </a>
            )}
          </div>
        ) : (
          <Link
            href={`/${locale}/login?returnUrl=/${locale}/listings/${listing.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted/10 transition-colors text-muted-foreground"
          >
            <UserCheck size={15} />
            سجّل دخولك لعرض التواصل
          </Link>
        )}
      </div>

      <RequestViewingModal
        listingId={listing.id}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

// ── Star Rating ───────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" style={{ direction: "ltr" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────
export function ListingDetailClient({
  listing,
  reviews,
  suggested,
  locale,
}: ListingDetailClientProps) {
  const availableBeds = listing.beds?.filter((b) => b.isAvailable).length ?? 0;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <main className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronLeft size={14} className="rtl:rotate-180" />
          <Link href={`/${locale}/search`} className="hover:text-primary transition-colors">البحث</Link>
          <ChevronLeft size={14} className="rtl:rotate-180" />
          <span className="text-foreground truncate max-w-[200px]">{listing.title}</span>
        </nav>
      </div>

      {/* Gallery */}
      <div className="container mx-auto px-4 mb-8 relative">
        <ImageGallery images={listing.images ?? []} title={listing.title} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="default">{TYPE_LABELS[listing.type] ?? listing.type}</Badge>
                {listing.isVerified && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle size={11} />
                    موثق
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-cairo leading-tight">
                {listing.title}
              </h1>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={16} className="text-primary shrink-0" />
                <span className="text-sm">{listing.district}، {listing.city}</span>
                {listing.governorate && (
                  <span className="text-sm text-muted-foreground/60">— {listing.governorate}</span>
                )}
              </div>

              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat("ar-EG").format(listing.price)}
                </span>
                <span className="text-muted-foreground"> جنيه/شهر</span>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3">الوصف</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">المميزات والخدمات</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.amenities.map((key) => {
                    const cfg = AMENITY_CONFIG[key] ?? { icon: <CheckCircle size={16} />, label: key };
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card text-sm"
                      >
                        <span className="text-primary">{cfg.icon}</span>
                        <span className="text-foreground">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Beds (if type is bed) */}
            {listing.type === "bed" && listing.beds && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">الأسرة المتاحة</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl font-bold text-primary">{availableBeds}</div>
                  <div className="text-sm text-muted-foreground">
                    {availableBeds === 1 ? "سرير متاح" : "أسرة متاحة"}
                    {" من أصل "}
                    {listing.beds.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.beds.map((bed) => (
                    <span
                      key={bed.id}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${
                        bed.isAvailable
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 line-through opacity-60"
                      }`}
                    >
                      سرير {bed.bedNumber}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">معلومات إضافية</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listing.securityDeposit !== undefined && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                    <Shield size={18} className="text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">التأمين</p>
                      <p className="text-sm font-semibold text-foreground">
                        {listing.securityDeposit
                          ? `${new Intl.NumberFormat("ar-EG").format(listing.securityDeposit)} جنيه`
                          : "لا يوجد"}
                      </p>
                    </div>
                  </div>
                )}
                {listing.includesBills !== undefined && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                    <Receipt size={18} className="text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">الفواتير</p>
                      <p className="text-sm font-semibold text-foreground">
                        {listing.includesBills ? "شامل الفواتير" : "الفواتير منفصلة"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* House Rules */}
            {listing.rules && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3">قواعد البيت</h2>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-line">
                    {listing.rules}
                  </p>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">التقييمات</h2>
                {avgRating !== null && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(avgRating)} />
                    <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({reviews.length})</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-2xl">
                  <Star size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد تقييمات بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {review.tenant?.name?.[0] ?? "م"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {review.tenant?.name ?? "مستخدم"}
                          </p>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="ms-auto text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Similar listings */}
            {suggested.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-5">إعلانات مشابهة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggested.slice(0, 4).map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Contact Card (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <ContactCard listing={listing} locale={locale} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Contact */}
      <div className="fixed bottom-0 start-0 end-0 z-30 p-4 lg:hidden bg-background/80 backdrop-blur-md border-t border-border">
        <ContactCard listing={listing} locale={locale} />
      </div>
    </main>
  );
}
