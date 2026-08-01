// apps/frontend/src/components/listings/detail/ListingActionCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Phone,
  UserCheck,
  Info,
  User,
  Star,
  Check,
} from "lucide-react";
import { Card, CardBody, Avatar, Badge, Button } from "@/components/ui";
import { getImageUrl } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingActionCardProps {
  listing: Listing;
  avgRating: number;
  mounted: boolean;
  currentUser: any;
  contactAccess: { canViewPhone: boolean; phone: string | null } | null;
  locale: string;
  onRequestViewing: () => void;
}

export function ListingActionCard({
  listing,
  avgRating,
  mounted,
  currentUser,
  contactAccess,
  locale,
  onRequestViewing,
}: ListingActionCardProps) {
  const isRtl = locale === "ar";

  return (
    <div className="space-y-4">
      {/* Additional Info & Landlord Details Splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columns A: Additional info */}
        <Card className="border border-border rounded-2xl bg-surface shadow-xs overflow-hidden">
          <CardBody className="p-5 space-y-4 font-cairo">
            <h3 className="font-bold text-text text-sm border-b border-border pb-2 flex items-center gap-2">
              <Info size={14} className="text-primary" />
              {isRtl ? "معلومات إضافية" : "Additional Info"}
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-tertiary">{isRtl ? "رقم الإعلان" : "Listing ID"}</span>
                <span className="font-mono font-semibold text-text">
                  #{listing.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-tertiary">{isRtl ? "تاريخ النشر" : "Published Date"}</span>
                <span className="font-semibold text-text">
                  {new Date(listing.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-tertiary">{isRtl ? "آخر تحديث" : "Last Updated"}</span>
                <span className="font-semibold text-text">
                  {new Date(listing.updatedAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-tertiary">{isRtl ? "حالة الإشغال" : "Occupancy"}</span>
                <span className="font-semibold">
                  {listing.status === "rented" ? (
                    <Badge className="bg-surface-tertiary text-text-secondary text-[10px]">
                      {isRtl ? "مؤجر" : "Rented"}
                    </Badge>
                  ) : (
                    <Badge className="bg-status-success/15 text-status-success border border-status-success/30 text-[10px]">
                      {isRtl ? "متاح" : "Active"}
                    </Badge>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-tertiary">{isRtl ? "إجمالي المشاهدات" : "Views Count"}</span>
                <span className="font-semibold text-text font-sans">
                  {listing.viewCount ?? listing.views ?? 0}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Columns B: Landlord details */}
        {listing.landlord && (
          <Card className="border border-border rounded-2xl bg-surface shadow-xs overflow-hidden">
            <CardBody className="p-5 space-y-4 font-cairo">
              <h3 className="font-bold text-text text-sm border-b border-border pb-2 flex items-center gap-2">
                <User size={14} className="text-primary" />
                {isRtl ? "تفاصيل المؤجر" : "Landlord Details"}
              </h3>
              <div className="flex items-center gap-3">
                <Avatar
                  src={listing.landlord.avatarUrl ? getImageUrl(listing.landlord.avatarUrl) : null}
                  name={listing.landlord.name}
                  size="md"
                  verified={listing.isVerified}
                />
                <div>
                  <h4 className="font-bold text-slate-900 leading-none text-xs">
                    {listing.landlord.name}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-semibold text-slate-600">
                      {avgRating.toFixed(1)}
                    </span>
                    {listing.isVerified && (
                      <Badge className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.25 font-bold ms-1 flex items-center gap-0.5">
                        <Check size={8} />
                        {isRtl ? "موثق" : "Verified"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isRtl ? "عدد الإعلانات" : "Listings"}</span>
                  <span className="font-semibold text-slate-700 font-sans">
                    {listing.landlord._count?.listings ?? 1}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isRtl ? "عضو منذ" : "Member Since"}</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(listing.landlord.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Call to Action request viewing block */}
      <Card className="border border-[#1B4F8A]/10 rounded-2xl bg-[#1B4F8A]/5 p-5 text-center space-y-3.5 shadow-sm font-cairo">
        <h3 className="font-bold text-slate-855 text-base">
          {isRtl ? "هل تريد معاينة العقار على الواقع؟" : "Want to view this property?"}
        </h3>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          {isRtl
            ? "قدم طلب معاينة وسيتواصل معك المؤجر لتحديد الموعد المناسب وتأكيده."
            : "Submit a viewing request and the landlord will coordinate to set up a convenient viewing time."}
        </p>

        <div className="max-w-md mx-auto pt-1 space-y-2.5">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={onRequestViewing}
            leftIcon={<Calendar size={14} />}
            className="text-xs font-bold py-3 rounded-xl shadow-xs"
          >
            {isRtl ? "طلب معاينة العقار" : "Request Viewing"}
          </Button>

          {/* Display phone contact detail once request is accepted */}
          {mounted && currentUser ? (
            <div className="pt-1 text-xs">
              {contactAccess?.canViewPhone && contactAccess.phone ? (
                <a
                  href={`tel:${contactAccess.phone}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 font-semibold hover:bg-slate-50 transition-colors text-slate-800"
                >
                  <Phone size={14} className="text-[#1B4F8A]" />
                  {isRtl ? "اتصال بالمؤجر:" : "Call Landlord:"} {contactAccess.phone}
                </a>
              ) : (
                <div className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-slate-100/50 border border-slate-200/60 text-[10px] text-slate-400">
                  <Phone size={12} className="text-slate-400" />
                  {isRtl
                    ? "سيتم إتاحة رقم التواصل فور قبول طلب المعاينة الخاص بك."
                    : "Phone number becomes available once your viewing request is accepted."}
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/${locale}/login?returnUrl=/${locale}/listings/${listing.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-[10px] font-semibold hover:bg-slate-50 transition-colors text-slate-500"
            >
              <UserCheck size={12} />
              {isRtl ? "سجّل دخولك كـمستأجر لعرض بيانات التواصل" : "Log in to view contact details"}
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
