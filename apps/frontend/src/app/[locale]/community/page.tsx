// apps/frontend/src/app/[locale]/community/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/features/auth";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Compass,
  MapPin,
  ChevronDown,
  Calendar,
  Bell,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  Check,
} from "lucide-react";
import { communityRepository } from "@/features/community";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants";
import { SearchFilterDrawer } from "@/features/search";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  governorateId: string;
  cityId: string;
  genderPreference: "MALES_ONLY" | "FEMALES_ONLY" | "ALL";
  maxParticipants: number;
  eventDate: string;
  timeSlot: string;
  status: "ACTIVE" | "ARCHIVED" | "CANCELLED" | "BLOCKED";
  category: Category;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    communityRatingAvg: number;
    communityReviewsCount: number;
  };
  participants: Array<{
    id: string;
    status: string;
  }>;
}

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CommunityPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  // Search & Filter State
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGov, setSelectedGov] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [genderPref, setGenderPref] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"governorate" | "district" | "category" | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      const target = e.target as HTMLElement;
      if (!target.closest(".modal-dropdown-container")) {
        setOpenModalDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Alerts states
  const [alertFormOpen, setAlertFormOpen] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertError, setAlertError] = useState("");
  const [alertCat, setAlertCat] = useState("");
  const [alertGov, setAlertGov] = useState("");
  const [alertCity, setAlertCity] = useState("");
  const [alertGender, setAlertGender] = useState<"ALL" | "MALES_ONLY" | "FEMALES_ONLY">("ALL");

  // Post Creation States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newGov, setNewGov] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newGender, setNewGender] = useState<"ALL" | "MALES_ONLY" | "FEMALES_ONLY">("ALL");
  const [newMaxPart, setNewMaxPart] = useState<number | "">("");
  const [newEventDate, setNewEventDate] = useState("");
  const [timeHour, setTimeHour] = useState("07");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("PM");
  const [openModalDropdown, setOpenModalDropdown] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const [govSearch, setGovSearch] = useState("");
  const [genderSearch, setGenderSearch] = useState("");

  // Load categories
  useEffect(() => {
    communityRepository.getCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error loading categories", err));
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = {
      page,
      limit,
    };
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.categoryId = selectedCategory;
    if (selectedGov) params.governorateId = selectedGov;
    if (cityQuery) params.cityId = cityQuery;
    if (genderPref) params.genderPreference = genderPref;
    if (selectedDate) params.date = selectedDate;

    communityRepository.getPosts(params)
      .then((data) => {
        setPosts(data.posts);
        setTotalCount(data.total);
      })
      .catch((err) => {
        console.error("Error loading posts", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, searchQuery, selectedCategory, selectedGov, cityQuery, genderPref, selectedDate]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle post creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess(false);

    const parsedMaxPart = Number(newMaxPart);

    if (
      !newTitle.trim() ||
      !newDesc.trim() ||
      !newCat ||
      !newGov ||
      !newCity ||
      !newEventDate ||
      !newMaxPart ||
      isNaN(parsedMaxPart) ||
      parsedMaxPart < 2
    ) {
      setCreateError(
        isRtl
          ? "الحد الأقصى للمشاركين يجب أن يكون شخصين على الأقل (2 أو أكثر) لتنظيم فعالية مجتمعية."
          : "Maximum participants must be at least 2 people to organize a community event."
      );
      return;
    }

    // Format 12h time (hour, minute, period AM/PM) into 24h string (HH:mm)
    let h = parseInt(timeHour || "12", 10);
    const m = (timeMinute || "00").padStart(2, "0");
    if (isNaN(h)) h = 12;
    if (h > 12) h = 12;
    if (h < 1) h = 1;

    if (timePeriod === "PM" && h < 12) {
      h += 12;
    } else if (timePeriod === "AM" && h === 12) {
      h = 0;
    }

    const formattedTimeSlot = `${h.toString().padStart(2, "0")}:${m}`;

    // Combine eventDate & formattedTimeSlot into exact DateTime and validate future status
    const [evYear, evMonth, evDay] = newEventDate.split('-').map(Number);
    const combinedEventDateTime = new Date(evYear, evMonth - 1, evDay, h, parseInt(m, 10), 0, 0);

    if (combinedEventDateTime < new Date()) {
      setCreateError(
        isRtl
          ? "توقيت الفعالية (التاريخ والوقت) لا يمكن أن يكون في الماضي."
          : "The activity date and time cannot be in the past."
      );
      return;
    }

    try {
      await communityRepository.createPost({
        title: newTitle,
        description: newDesc,
        categoryId: newCat,
        governorateId: newGov,
        cityId: newCity,
        genderPreference: newGender,
        maxParticipants: parsedMaxPart,
        eventDate: newEventDate,
        timeSlot: formattedTimeSlot,
      });

      setCreateSuccess(true);
      setNewTitle("");
      setNewDesc("");
      setNewCat("");
      setNewGov("");
      setNewCity("");
      setNewGender("ALL");
      setNewMaxPart("");
      setNewEventDate("");
      setTimeHour("07");
      setTimeMinute("00");
      setTimePeriod("PM");
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateSuccess(false);
        fetchPosts();
      }, 1500);
    } catch (err: any) {
      const rawMsg = err.response?.data?.message;
      let userFriendlyMsg = isRtl ? "حدث خطأ أثناء إنشاء النشاط." : "An error occurred while creating the activity.";

      if (Array.isArray(rawMsg)) {
        userFriendlyMsg = rawMsg.join(", ");
      } else if (typeof rawMsg === "string") {
        if (rawMsg.includes("maxParticipants must not be less than 2")) {
          userFriendlyMsg = isRtl ? "الحد الأقصى للمشاركين يجب أن يكون شخصين على الأقل (2 أو أكثر)." : "Max participants must be at least 2.";
        } else {
          userFriendlyMsg = rawMsg;
        }
      }

      setCreateError(userFriendlyMsg);
    }
  };

  // Handle alert creation
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError("");
    setAlertSuccess(false);

    if (!alertCat || !alertGov || !alertCity) {
      setAlertError(isRtl ? "برجاء تعبئة كافة الحقول للطلب الذكي." : "Please fill all fields for smart alert.");
      return;
    }

    try {
      await communityRepository.createAlert({
        categoryId: alertCat,
        governorateId: alertGov,
        cityId: alertCity,
        genderPreference: alertGender,
      });
      setAlertSuccess(true);
      setAlertCat("");
      setAlertGov("");
      setAlertCity("");
      setAlertGender("ALL");
      setTimeout(() => {
        setAlertFormOpen(false);
        setAlertSuccess(false);
      }, 1500);
    } catch (err: any) {
      setAlertError(
        err.response?.data?.message ||
        (isRtl ? "فشل إعداد التنبيه الذكي." : "Failed to setup smart alert.")
      );
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-12 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Compass size={14} className="text-amber-400" />
              <span>{isRtl ? "مجتمع سكني التفاعلي" : "Sakani Interactive Community"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-cairo">
              {isRtl ? "تواصل وتشارك مع الجيران والزملاء" : "Connect & Share Activities with Neighbors"}
            </h1>
            <p className="text-blue-100 max-w-2xl text-sm md:text-base font-cairo">
              {isRtl
                ? "ابحث عن أنشطة مشتركة في منطقتك؛ كورة قدم، ألعاب فيديو، خروجات، أو مجموعات دراسة، ونظم لقاءك القادم بكل أمان."
                : "Find shared activities in your area: football games, gaming nights, outings, or study groups."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => router.push(`/${locale}/dashboard/tenant/alerts?type=community`)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl font-semibold transition-all text-sm font-cairo cursor-pointer"
              >
                <Bell size={18} className="text-amber-400" />
                {isRtl ? "تنبيه ذكي بالأنشطة" : "Smart Activity Alerts"}
              </button>
            )}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  router.push(`/${locale}/login`);
                } else {
                  setCreateModalOpen(true);
                }
              }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-5 py-2.5 rounded-xl font-bold transition-all text-sm font-cairo shadow-lg shadow-amber-500/20"
            >
              <Plus size={18} />
              {isRtl ? "إضافة نشاط جديد" : "Add New Activity"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Search Header Container - Matching /search layout & SearchHeader UI component exactly */}
        <div ref={filterRef} className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3 font-cairo z-30 relative">
          {/* Top Row: Search Input + Filters Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <div className="absolute start-3 pointer-events-none text-text-tertiary flex items-center justify-center">
                <Search size={16} />
              </div>
              <input
                type="text"
                aria-label="البحث بالمنطقة أو الوصف"
                placeholder={isRtl ? "ابحث بالمنطقة، أو التفاصيل، أو اسم الفعالية..." : "Search by region, details, or title..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-secondary focus:bg-surface border border-border rounded-xl py-2.5 ps-9 pe-8 text-xs sm:text-sm font-semibold text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 font-cairo transition-all"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-2 h-6 w-6 p-0 text-text-tertiary hover:text-text"
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            {/* More Filters Trigger Button */}
            <Button
              type="button"
              variant={(genderPref || selectedDate) ? "primary" : "outline"}
              size="md"
              onClick={() => setFilterDrawerOpen(true)}
              aria-label="فتح فلاتر المجتمع المتقدمة"
              leftIcon={<SlidersHorizontal size={16} />}
              className="shrink-0 text-xs font-bold rounded-xl"
            >
              الفلاتر
              {(genderPref || selectedDate) && (
                <span className="ms-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-text">
                  {(genderPref ? 1 : 0) + (selectedDate ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Quick Filters Strip - 3 Equal Compact Primary Pill Buttons */}
          <div className="flex items-center gap-2 text-xs font-semibold font-cairo z-40 relative flex-nowrap">
            {/* 1. Governorate Pill */}
            <div className="relative">
              <Button
                type="button"
                variant={selectedGov ? "primary" : "outline"}
                size="sm"
                onClick={() => setOpenDropdown((prev) => (prev === "governorate" ? null : "governorate"))}
                leftIcon={<MapPin size={13} />}
                rightIcon={<ChevronDown size={13} />}
                className="rounded-full text-xs font-bold whitespace-nowrap"
              >
                {selectedGov || (isRtl ? "المحافظة" : "Governorate")}
              </Button>

              {openDropdown === "governorate" && (
                <div className="absolute start-0 top-full mt-1.5 w-44 bg-surface rounded-2xl shadow-xl border border-border p-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-cairo">
                  <Button
                    type="button"
                    variant={!selectedGov ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setSelectedGov("");
                      setPage(1);
                      setOpenDropdown(null);
                    }}
                    className="w-full justify-start text-xs rounded-lg font-cairo"
                  >
                    {isRtl ? "كل المحافظات" : "All Governorates"}
                  </Button>
                  {EGYPTIAN_GOVERNORATES.map((gov) => (
                    <Button
                      key={gov}
                      type="button"
                      variant={selectedGov === gov ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedGov(gov);
                        setPage(1);
                        setOpenDropdown(null);
                      }}
                      className="w-full justify-start text-xs rounded-lg mt-0.5 font-cairo"
                    >
                      {gov}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. City Pill */}
            <div className="relative">
              <Button
                type="button"
                variant={cityQuery ? "primary" : "outline"}
                size="sm"
                onClick={() => setOpenDropdown((prev) => (prev === "district" ? null : "district"))}
                leftIcon={<MapPin size={13} />}
                rightIcon={<ChevronDown size={13} />}
                className="rounded-full text-xs font-bold whitespace-nowrap"
              >
                {cityQuery || (isRtl ? "المدينة" : "City")}
              </Button>

              {openDropdown === "district" && (
                <div className="absolute start-0 top-full mt-1.5 w-56 bg-surface rounded-2xl shadow-xl border border-border p-3 z-50 animate-in fade-in zoom-in-95 duration-150 font-cairo space-y-2.5">
                  <Input
                    type="text"
                    placeholder={isRtl ? "ابحث عن مدينة أو حي..." : "Search city or district..."}
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setPage(1);
                    }}
                    className="text-xs font-semibold py-1.5 px-2.5 h-8"
                  />
                  <div className="flex justify-between items-center pt-1.5 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCityQuery("");
                        setPage(1);
                        setOpenDropdown(null);
                      }}
                      className="text-[10px] text-text-secondary hover:text-text p-1 h-auto"
                      leftIcon={<RotateCcw size={10} />}
                    >
                      مسح
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setOpenDropdown(null)}
                      className="text-[11px] font-bold px-3 py-1 h-7 rounded-lg"
                      leftIcon={<Check size={12} />}
                    >
                      تطبيق
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Activity Type / Category Pill */}
            <div className="relative">
              <Button
                type="button"
                variant={selectedCategory ? "primary" : "outline"}
                size="sm"
                onClick={() => setOpenDropdown((prev) => (prev === "category" ? null : "category"))}
                leftIcon={<Compass size={13} />}
                rightIcon={<ChevronDown size={13} />}
                className="rounded-full text-xs font-bold whitespace-nowrap"
              >
                {categories.find(c => c.id === selectedCategory)?.[isRtl ? "nameAr" : "nameEn"] || (isRtl ? "نوع النشاط" : "Activity Type")}
              </Button>

              {openDropdown === "category" && (
                <div className="absolute start-0 top-full mt-1.5 w-52 bg-surface rounded-2xl shadow-xl border border-border p-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-cairo">
                  <Button
                    type="button"
                    variant={!selectedCategory ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("");
                      setPage(1);
                      setOpenDropdown(null);
                    }}
                    className="w-full justify-start text-xs rounded-lg font-cairo"
                  >
                    {isRtl ? "كل الأنشطة والتصنيفات" : "All Activities"}
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      type="button"
                      variant={selectedCategory === cat.id ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setPage(1);
                        setOpenDropdown(null);
                      }}
                      className="w-full justify-start text-xs rounded-lg mt-0.5 font-cairo"
                    >
                      <span className="me-1.5">{cat.icon}</span>
                      {isRtl ? cat.nameAr : cat.nameEn}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Bar Header - Matching /search count style */}
        <div className="flex items-center justify-between font-cairo px-1">
          <h2 className="text-sm sm:text-base font-extrabold text-text">
            {isRtl ? `عُثر على ${totalCount} نتيجة` : `Found ${totalCount} results`}
          </h2>
        </div>

        {/* Reusing SearchFilterDrawer for Non-Duplicated Additional Community Filters */}
        <SearchFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          title={isRtl ? "فلاتر المجتمع التفصيلية" : "Detailed Community Filters"}
          subtitle={isRtl ? "تخصيص نتائج الأنشطة والتجمعات المجتمعية" : "Filter activities and community events"}
          totalCount={totalCount}
          onApply={() => {
            setFilterDrawerOpen(false);
            fetchPosts();
          }}
          onReset={() => {
            setGenderPref("");
            setSelectedDate("");
            setPage(1);
          }}
        >
          <div className="space-y-4 font-cairo">
            {/* Target Gender Filter - Custom Popover Dropdown */}
            <div className="space-y-1 relative font-cairo">
              <label className="text-xs font-semibold text-text-secondary block">
                {isRtl ? "الجنس المستهدف" : "Target Gender"}
              </label>
              <button
                type="button"
                onClick={() => setOpenModalDropdown(openModalDropdown === "drawerGender" ? null : "drawerGender")}
                className="w-full bg-surface-secondary border border-border rounded-xl py-2 px-3 text-xs text-text font-cairo flex items-center justify-between hover:bg-surface-tertiary transition-all font-semibold cursor-pointer"
              >
                <span className="truncate font-cairo text-start">
                  {genderPref === "MALES_ONLY"
                    ? (isRtl ? "ذكور فقط" : "Males Only")
                    : genderPref === "FEMALES_ONLY"
                    ? (isRtl ? "إناث فقط" : "Females Only")
                    : (isRtl ? "الجميع (مفتوح للكل)" : "All")}
                </span>
                <ChevronDown size={14} className="text-text-tertiary shrink-0 ms-1" />
              </button>

              {openModalDropdown === "drawerGender" && (
                <div className="absolute start-0 top-full mt-1.5 w-full bg-surface rounded-2xl shadow-xl border border-border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 font-cairo">
                  {[
                    { value: "", label: isRtl ? "الجميع (مفتوح للكل)" : "All" },
                    { value: "MALES_ONLY", label: isRtl ? "ذكور فقط" : "Males Only" },
                    { value: "FEMALES_ONLY", label: isRtl ? "إناث فقط" : "Females Only" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setGenderPref(opt.value);
                        setOpenModalDropdown(null);
                      }}
                      className={cn(
                        "w-full text-start px-3 py-2 text-xs font-bold rounded-xl transition-colors font-cairo flex items-center justify-between cursor-pointer my-0.5",
                        genderPref === opt.value
                          ? "bg-primary/10 text-primary font-extrabold"
                          : "text-text-secondary hover:bg-surface-secondary"
                      )}
                    >
                      <span className="font-cairo">{opt.label}</span>
                      {genderPref === opt.value && <Check size={14} className="text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Event Date Filter */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">
                {isRtl ? "تاريخ الفعالية" : "Event Date"}
              </label>
              <input
                type="date"
                min={getLocalDateString()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>
        </SearchFilterDrawer>

          {/* Posts List Section */}
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white h-64 border border-slate-200 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                <Compass size={48} className="text-slate-300" />
                <h3 className="text-lg font-bold text-slate-900 font-cairo">
                  {isRtl ? "لا توجد أنشطة مطابقة" : "No Matching Activities"}
                </h3>
                <p className="text-slate-500 max-w-sm text-sm font-cairo">
                  {isRtl
                    ? "لم نجد أي منشورات مطابقة لفلاتر البحث الحالية. جرب تغيير مدخلات البحث أو إضافة نشاط بنفسك."
                    : "No activities found matching your filters. Try updating your filters or publish your own activity!"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  {posts.map((post) => {
                    const acceptedParticipantsCount = post.participants?.filter(
                      (p) => p.status === "ACCEPTED"
                    ).length || 0;
                    const isFull = acceptedParticipantsCount >= post.maxParticipants;

                    return (
                      <Link
                        key={post.id}
                        href={`/${locale}/community/${post.id}`}
                        className="group bg-surface border border-border rounded-xl p-3 sm:p-4 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between relative cursor-pointer"
                      >
                        {/* Top Category & Capacity Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold font-cairo">
                            <span>{post.category.icon}</span>
                            <span className="truncate max-w-[80px] sm:max-w-[120px]">{isRtl ? post.category.nameAr : post.category.nameEn}</span>
                          </span>

                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold font-cairo ${
                              isFull
                                ? "bg-status-danger/15 text-status-danger"
                                : "bg-status-success/15 text-status-success"
                            }`}
                          >
                            {isFull ? (isRtl ? "مكتمل" : "Full") : `${acceptedParticipantsCount}/${post.maxParticipants}`}
                          </span>
                        </div>

                        {/* Title & Location */}
                        <div className="space-y-1 my-1 flex-1">
                          <h3 className="font-bold text-text line-clamp-1 text-xs sm:text-sm font-cairo group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-text-secondary font-cairo">
                            <MapPin size={11} className="text-primary shrink-0" />
                            <span className="truncate">{post.governorateId}، {post.cityId}</span>
                          </div>
                        </div>

                        {/* Card Footer Link */}
                        <div className="border-t border-border/50 pt-2 mt-2 flex items-center justify-between text-[10px] sm:text-xs text-text-tertiary font-cairo">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            <span>{new Date(post.eventDate).toLocaleDateString(locale)}</span>
                          </span>

                          <span className="font-bold text-primary group-hover:underline">
                            {isRtl ? "التفاصيل ←" : "Details →"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 font-cairo">
                      {isRtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} className={isRtl ? "" : "rotate-180"} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* CREATE ALERT MODAL */}
      {alertFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-cairo flex items-center gap-2">
                <Bell size={18} className="text-amber-500" />
                {isRtl ? "إعداد تنبيه بالأنشطة الذكي" : "Setup Smart Activity Alert"}
              </h3>
              <button
                onClick={() => setAlertFormOpen(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {alertSuccess ? (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold font-cairo">
                <CheckCircle size={20} />
                <span>{isRtl ? "تم حفظ التنبيه الذكي بنجاح!" : "Smart alert saved successfully!"}</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="space-y-4">
                {alertError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle size={16} />
                    <span>{alertError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 font-cairo">
                    {isRtl ? "نوع النشاط المطلوب" : "Activity Category"}
                  </label>
                  <select
                    value={alertCat}
                    onChange={(e) => setAlertCat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 font-cairo"
                    required
                  >
                    <option value="">{isRtl ? "اختر التصنيف..." : "Choose Category..."}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {isRtl ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 font-cairo">
                    {isRtl ? "المحافظة" : "Governorate"}
                  </label>
                  <select
                    value={alertGov}
                    onChange={(e) => setAlertGov(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 font-cairo"
                    required
                  >
                    <option value="">{isRtl ? "اختر المحافظة..." : "Choose Governorate..."}</option>
                    {EGYPTIAN_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 font-cairo">
                    {isRtl ? "المدينة أو الحي" : "City or District"}
                  </label>
                  <input
                    type="text"
                    placeholder={isRtl ? "مثال: مدينة نصر" : "e.g. City"}
                    value={alertCity}
                    onChange={(e) => setAlertCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 font-cairo"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 font-cairo">
                    {isRtl ? "تفضيل الجنس" : "Gender Preference"}
                  </label>
                  <select
                    value={alertGender}
                    onChange={(e) => setAlertGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 font-cairo"
                  >
                    <option value="ALL">{isRtl ? "الجميع" : "All"}</option>
                    <option value="MALES_ONLY">{isRtl ? "ذكور فقط" : "Males Only"}</option>
                    <option value="FEMALES_ONLY">{isRtl ? "إناث فقط" : "Females Only"}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm font-cairo"
                >
                  {isRtl ? "حفظ التنبيه الذكي" : "Save Alert"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE POST MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-cairo flex items-center gap-2">
                <Plus size={18} className="text-amber-500" />
                {isRtl ? "إضافة منشور نشاط جديد" : "Create New Activity Post"}
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {createSuccess ? (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold font-cairo">
                <CheckCircle size={20} />
                <span>{isRtl ? "تم نشر النشاط بنجاح وتنبيه المشتركين المهتمين!" : "Activity published successfully and alerts sent!"}</span>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-4">
                {createError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold font-cairo">
                    <AlertTriangle size={16} />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-slate-500 font-cairo">
                      {isRtl ? "عنوان النشاط" : "Activity Title"} *
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? "مثال: نلعب كورة قدم في الجيزة" : "e.g. Football match"}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-slate-500 font-cairo">
                      {isRtl ? "الوصف والتفاصيل" : "Description / Details"} *
                    </label>
                    <textarea
                      placeholder={isRtl ? "اكتب تفاصيل الفعالية، موعد التجمع، والشروط..." : "Details of the activity..."}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all"
                      required
                    />
                  </div>

                  {/* 1. Category Searchable Combobox */}
                  <div className="space-y-1 relative font-cairo modal-dropdown-container">
                    <label className="text-xs font-semibold text-slate-500 font-cairo block">
                      {isRtl ? "التصنيف" : "Category"} *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder={isRtl ? "ابحث أو اختر..." : "Search or choose..."}
                        value={
                          openModalDropdown === "modalCategory"
                            ? catSearch
                            : (categories.find(c => c.id === newCat)?.[isRtl ? "nameAr" : "nameEn"] || catSearch)
                        }
                        onFocus={() => {
                          setOpenModalDropdown("modalCategory");
                          setCatSearch("");
                        }}
                        onChange={(e) => {
                          setCatSearch(e.target.value);
                          if (openModalDropdown !== "modalCategory") setOpenModalDropdown("modalCategory");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 ps-3 pe-8 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all"
                      />
                      <ChevronDown size={16} className="absolute end-2.5 text-slate-400 pointer-events-none shrink-0" />
                    </div>

                    {openModalDropdown === "modalCategory" && (
                      <div className="absolute start-0 top-full mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-border p-1.5 z-50 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-cairo">
                        {categories
                          .filter(c => (isRtl ? c.nameAr : c.nameEn).toLowerCase().includes(catSearch.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setNewCat(c.id);
                                setCatSearch(isRtl ? c.nameAr : c.nameEn);
                                setOpenModalDropdown(null);
                              }}
                              className={cn(
                                "w-full text-start px-3 py-2 text-xs font-bold rounded-xl transition-colors font-cairo flex items-center justify-between cursor-pointer my-0.5",
                                newCat === c.id
                                  ? "bg-blue-50 text-blue-600 font-extrabold"
                                  : "text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              <span className="flex items-center gap-1.5 font-cairo">
                                <span>{c.icon}</span>
                                {isRtl ? c.nameAr : c.nameEn}
                              </span>
                              {newCat === c.id && <Check size={14} className="text-blue-600 shrink-0" />}
                            </button>
                          ))}
                        {categories.filter(c => (isRtl ? c.nameAr : c.nameEn).toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2.5 text-xs text-slate-400 font-cairo text-center">
                            {isRtl ? "لا توجد نتائج مطابقة" : "No results found"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Max Participants */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 font-cairo">
                      {isRtl ? "الحد الأقصى للمشاركين" : "Max Participants"} *
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      placeholder={isRtl ? "ادخل العدد (شخصين أو أكثر)" : "e.g. 5"}
                      value={newMaxPart}
                      onChange={(e) => setNewMaxPart(e.target.value === "" ? "" : Math.max(2, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all"
                      required
                    />
                  </div>

                  {/* 3. Governorate Searchable Combobox */}
                  <div className="space-y-1 relative font-cairo modal-dropdown-container">
                    <label className="text-xs font-semibold text-slate-500 font-cairo block">
                      {isRtl ? "المحافظة" : "Governorate"} *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder={isRtl ? "ابحث أو اختر..." : "Search or choose..."}
                        value={
                          openModalDropdown === "modalGov"
                            ? govSearch
                            : (newGov || govSearch)
                        }
                        onFocus={() => {
                          setOpenModalDropdown("modalGov");
                          setGovSearch("");
                        }}
                        onChange={(e) => {
                          setGovSearch(e.target.value);
                          if (openModalDropdown !== "modalGov") setOpenModalDropdown("modalGov");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 ps-3 pe-8 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all"
                      />
                      <ChevronDown size={16} className="absolute end-2.5 text-slate-400 pointer-events-none shrink-0" />
                    </div>

                    {openModalDropdown === "modalGov" && (
                      <div className="absolute start-0 top-full mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-border p-1.5 z-50 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-cairo">
                        {EGYPTIAN_GOVERNORATES
                          .filter(g => g.toLowerCase().includes(govSearch.toLowerCase()))
                          .map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                setNewGov(g);
                                setGovSearch(g);
                                setOpenModalDropdown(null);
                              }}
                              className={cn(
                                "w-full text-start px-3 py-2 text-xs font-bold rounded-xl transition-colors font-cairo flex items-center justify-between cursor-pointer my-0.5",
                                newGov === g
                                  ? "bg-blue-50 text-blue-600 font-extrabold"
                                  : "text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              <span className="font-cairo">{g}</span>
                              {newGov === g && <Check size={14} className="text-blue-600 shrink-0" />}
                            </button>
                          ))}
                        {EGYPTIAN_GOVERNORATES.filter(g => g.toLowerCase().includes(govSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2.5 text-xs text-slate-400 font-cairo text-center">
                            {isRtl ? "لا توجد نتائج مطابقة" : "No results found"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. City / District Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 font-cairo">
                      {isRtl ? "المدينة أو الحي" : "City / District"} *
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? "مثال: مدينة نصر" : "e.g. Heliopolis"}
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all"
                      required
                    />
                  </div>

                  {/* Date & Target Gender side-by-side */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 font-cairo">
                      {isRtl ? "التاريخ" : "Date"} *
                    </label>
                    <input
                      type="date"
                      min={getLocalDateString()}
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 px-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all cursor-pointer"
                      required
                    />
                  </div>

                  {/* 5. Target Gender Searchable Combobox */}
                  <div className="space-y-1 relative font-cairo modal-dropdown-container">
                    <label className="text-xs font-semibold text-slate-500 font-cairo block">
                      {isRtl ? "تفضيل الجنس" : "Target Gender"}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder={isRtl ? "ابحث أو اختر..." : "Search or choose..."}
                        value={
                          openModalDropdown === "modalGender"
                            ? genderSearch
                            : (newGender === "MALES_ONLY"
                                ? (isRtl ? "ذكور فقط" : "Males Only")
                                : newGender === "FEMALES_ONLY"
                                ? (isRtl ? "إناث فقط" : "Females Only")
                                : (isRtl ? "مفتوح للجميع" : "All"))
                        }
                        onFocus={() => {
                          setOpenModalDropdown("modalGender");
                          setGenderSearch("");
                        }}
                        onChange={(e) => {
                          setGenderSearch(e.target.value);
                          if (openModalDropdown !== "modalGender") setOpenModalDropdown("modalGender");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 ps-3 pe-8 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-cairo transition-all"
                      />
                      <ChevronDown size={16} className="absolute end-2.5 text-slate-400 pointer-events-none shrink-0" />
                    </div>

                    {openModalDropdown === "modalGender" && (
                      <div className="absolute start-0 top-full mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 font-cairo">
                        {[
                          { value: "ALL", label: isRtl ? "مفتوح للجميع" : "All" },
                          { value: "MALES_ONLY", label: isRtl ? "ذكور فقط" : "Males Only" },
                          { value: "FEMALES_ONLY", label: isRtl ? "إناث فقط" : "Females Only" },
                        ]
                          .filter(opt => opt.label.toLowerCase().includes(genderSearch.toLowerCase()))
                          .map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setNewGender(opt.value as any);
                                setGenderSearch(opt.label);
                                setOpenModalDropdown(null);
                              }}
                              className={cn(
                                "w-full text-start px-3 py-2 text-xs font-bold rounded-xl transition-colors font-cairo flex items-center justify-between cursor-pointer my-0.5",
                                newGender === opt.value
                                  ? "bg-blue-50 text-blue-600 font-extrabold"
                                  : "text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              <span className="font-cairo">{opt.label}</span>
                              {newGender === opt.value && <Check size={14} className="text-blue-600 shrink-0" />}
                            </button>
                          ))}
                        {[
                          { value: "ALL", label: isRtl ? "مفتوح للجميع" : "All" },
                          { value: "MALES_ONLY", label: isRtl ? "ذكور فقط" : "Males Only" },
                          { value: "FEMALES_ONLY", label: isRtl ? "إناث فقط" : "Females Only" },
                        ].filter(opt => opt.label.toLowerCase().includes(genderSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2.5 text-xs text-slate-400 font-cairo text-center">
                            {isRtl ? "لا توجد نتائج مطابقة" : "No results found"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Event Time Full-Width Row underneath */}
                  <div className="space-y-1 col-span-2 pt-1 border-t border-slate-100">
                    <label className="text-xs font-semibold text-slate-500 font-cairo block">
                      {isRtl ? "توقيت الفعالية" : "Event Time"} *
                    </label>
                    <div className="flex items-start gap-3 font-cairo bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                      {/* 1. Minutes Column (أول حاجة على اليمين) */}
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="text"
                          maxLength={2}
                          value={timeMinute}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => {
                            if (timeMinute === "") setTimeMinute("00");
                            else {
                              const num = parseInt(timeMinute, 10);
                              if (isNaN(num) || num < 0) setTimeMinute("00");
                              else if (num > 59) setTimeMinute("59");
                              else setTimeMinute(num.toString().padStart(2, "0"));
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setTimeMinute(val);
                          }}
                          className="w-16 bg-white border border-slate-200 rounded-xl py-2 px-1 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 text-center font-cairo shadow-xs"
                          required
                        />
                        <span className="text-[10px] font-bold text-slate-400 font-cairo">
                          {isRtl ? "دقيقة" : "Minute"}
                        </span>
                      </div>

                      {/* 2. Colon Separator */}
                      <span className="text-slate-400 font-extrabold text-base pt-2.5">:</span>

                      {/* 3. Hours Column (الساعات) */}
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="text"
                          maxLength={2}
                          value={timeHour}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => {
                            if (!timeHour) setTimeHour("07");
                            else {
                              const num = parseInt(timeHour, 10);
                              if (isNaN(num) || num < 1) setTimeHour("01");
                              else if (num > 12) setTimeHour("12");
                              else setTimeHour(num.toString().padStart(2, "0"));
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setTimeHour(val);
                          }}
                          className="w-16 bg-white border border-slate-200 rounded-xl py-2 px-1 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 text-center font-cairo shadow-xs"
                          required
                        />
                        <span className="text-[10px] font-bold text-slate-400 font-cairo">
                          {isRtl ? "ساعة" : "Hour"}
                        </span>
                      </div>

                      {/* 4. AM / PM (ص / م) Toggle */}
                      <div className="flex flex-col gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0 shadow-xs ms-1">
                        <button
                          type="button"
                          onClick={() => setTimePeriod("AM")}
                          className={cn(
                            "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer font-cairo leading-none min-w-[42px] text-center",
                            timePeriod === "AM"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          {isRtl ? "ص" : "AM"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimePeriod("PM")}
                          className={cn(
                            "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer font-cairo leading-none min-w-[42px] text-center",
                            timePeriod === "PM"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          {isRtl ? "م" : "PM"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 font-cairo">
                  <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>
                    {isRtl
                      ? "سيتم مراجعة الكلمات والوصف تلقائياً لحظر الألفاظ غير اللائقة، وسيتم تنبيه جميع الأعضاء المهتمين فوراً."
                      : "Title & description will be filtered for safety, and matching user alerts will trigger immediately."}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm font-cairo shadow-lg shadow-blue-600/20"
                >
                  {isRtl ? "نشر النشاط الآن" : "Publish Activity"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
