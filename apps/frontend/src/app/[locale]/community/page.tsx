// apps/frontend/src/app/[locale]/community/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/store/auth.store";
import {
  Search,
  Filter,
  Plus,
  Compass,
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Bell,
  Star,
  CheckCircle,
  Trash2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants";
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

export default function CommunityPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const { user, token } = useAuthStore();
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
  const [page, setPage] = useState(1);
  const limit = 12;

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
  const [newMaxPart, setNewMaxPart] = useState(5);
  const [newEventDate, setNewEventDate] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");

  // Load categories
  useEffect(() => {
    api.get("/community/categories")
      .then((res) => setCategories(res.data))
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

    api.get("/community", { params })
      .then((res) => {
        setPosts(res.data.posts);
        setTotalCount(res.data.total);
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

    if (!newTitle.trim() || !newDesc.trim() || !newCat || !newGov || !newCity || !newEventDate || !newTimeSlot) {
      setCreateError(isRtl ? "برجاء تعبئة كافة الحقول المطلوبة." : "Please fill out all required fields.");
      return;
    }

    try {
      await api.post("/community", {
        title: newTitle,
        description: newDesc,
        categoryId: newCat,
        governorateId: newGov,
        cityId: newCity,
        genderPreference: newGender,
        maxParticipants: Number(newMaxPart),
        eventDate: newEventDate,
        timeSlot: newTimeSlot,
      });

      setCreateSuccess(true);
      setNewTitle("");
      setNewDesc("");
      setNewCat("");
      setNewGov("");
      setNewCity("");
      setNewGender("ALL");
      setNewMaxPart(5);
      setNewEventDate("");
      setNewTimeSlot("");
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateSuccess(false);
        fetchPosts();
      }, 1500);
    } catch (err: any) {
      setCreateError(
        err.response?.data?.message ||
        (isRtl ? "حدث خطأ أثناء إنشاء النشاط." : "An error occurred while creating the activity.")
      );
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
      await api.post("/community/alerts", {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
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
                onClick={() => setAlertFormOpen(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl font-semibold transition-all text-sm font-cairo"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Filter size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-slate-950 dark:text-white font-cairo">
                {isRtl ? "تصفية الأنشطة" : "Filter Activities"}
              </h2>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                {isRtl ? "البحث بالاسم والوصف" : "Search Title / Desc"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={isRtl ? "ابحث..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 pl-9 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* Categories Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                {isRtl ? "التصنيف" : "Category"}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-cairo"
              >
                <option value="">{isRtl ? "كل التصنيفات" : "All Categories"}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {isRtl ? cat.nameAr : cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Governorate Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                {isRtl ? "المحافظة" : "Governorate"}
              </label>
              <select
                value={selectedGov}
                onChange={(e) => {
                  setSelectedGov(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-cairo"
              >
                <option value="">{isRtl ? "كل المحافظات" : "All Governorates"}</option>
                {EGYPTIAN_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            {/* City / District */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                {isRtl ? "المدينة / الحي" : "City / District"}
              </label>
              <input
                type="text"
                placeholder={isRtl ? "مثال: مدينة نصر" : "e.g. Heliopolis"}
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-cairo"
              />
            </div>

            {/* Gender Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                {isRtl ? "الجنس المستهدف" : "Target Gender"}
              </label>
              <select
                value={genderPref}
                onChange={(e) => {
                  setGenderPref(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-cairo"
              >
                <option value="">{isRtl ? "الجميع" : "All"}</option>
                <option value="MALES_ONLY">{isRtl ? "ذكور فقط" : "Males Only"}</option>
                <option value="FEMALES_ONLY">{isRtl ? "إناث فقط" : "Females Only"}</option>
                <option value="ALL">{isRtl ? "مفتوح للكل" : "Mixed"}</option>
              </select>
            </div>

            {/* Datepicker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                {isRtl ? "التاريخ" : "Date"}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clear Button */}
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setSelectedGov("");
                setCityQuery("");
                setGenderPref("");
                setSelectedDate("");
                setPage(1);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all font-cairo"
            >
              {isRtl ? "إعادة تعيين الفلاتر" : "Reset Filters"}
            </button>
          </div>

          {/* Posts List Section */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-800 h-64 border border-slate-200 dark:border-slate-700 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                <Compass size={48} className="text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => {
                    const acceptedParticipantsCount = post.participants?.filter(
                      (p) => p.status === "ACCEPTED"
                    ).length || 0;
                    const isFull = acceptedParticipantsCount >= post.maxParticipants;

                    return (
                      <div
                        key={post.id}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm relative group"
                      >
                        {/* Top Category Badge */}
                        <div className="flex justify-between items-start mb-3">
                          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold font-cairo">
                            <span>{post.category.icon}</span>
                            <span>{isRtl ? post.category.nameAr : post.category.nameEn}</span>
                          </span>

                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold font-cairo ${
                              isFull
                                ? "bg-red-50 dark:bg-red-900/30 text-red-600"
                                : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
                            }`}
                          >
                            {isFull ? (isRtl ? "مكتمل العدد" : "Full") : `${acceptedParticipantsCount} / ${post.maxParticipants} ${isRtl ? "أماكن" : "places"}`}
                          </span>
                        </div>

                        {/* Host / Organizer Trust Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                            {post.user.avatarUrl ? (
                              <img src={post.user.avatarUrl} alt="" className="object-cover w-full h-full" />
                            ) : (
                              <span className="text-xs font-bold text-slate-500">{post.user.name[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-cairo">
                              {post.user.name}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                              <Star size={10} fill="currentColor" />
                              <span>{post.user.communityRatingAvg ? post.user.communityRatingAvg.toFixed(1) : "0.0"}</span>
                              <span className="text-slate-400">({post.user.communityReviewsCount})</span>
                            </div>
                          </div>
                        </div>

                        {/* Info details */}
                        <div className="space-y-1 mb-4 flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-base font-cairo">
                            {post.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-cairo">
                            {post.description}
                          </p>
                        </div>

                        {/* Meta info footer inside card */}
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-auto space-y-2 text-xs text-slate-500 dark:text-slate-400 font-cairo">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-blue-500" />
                              <span>{post.governorateId}، {post.cityId}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-blue-500" />
                              <span>{new Date(post.eventDate).toLocaleDateString(locale)}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                              <Clock size={12} />
                              <span>{post.timeSlot}</span>
                            </span>

                            <Link
                              href={`/${locale}/community/${post.id}`}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                            >
                              {isRtl ? "عرض التفاصيل ←" : "View Details →"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-cairo">
                      {isRtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} className={isRtl ? "" : "rotate-180"} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CREATE ALERT MODAL */}
      {alertFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <Bell size={18} className="text-amber-500" />
                {isRtl ? "إعداد تنبيه بالأنشطة الذكي" : "Setup Smart Activity Alert"}
              </h3>
              <button
                onClick={() => setAlertFormOpen(false)}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            {alertSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold font-cairo">
                <CheckCircle size={20} />
                <span>{isRtl ? "تم حفظ التنبيه الذكي بنجاح!" : "Smart alert saved successfully!"}</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="space-y-4">
                {alertError && (
                  <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle size={16} />
                    <span>{alertError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                    {isRtl ? "نوع النشاط المطلوب" : "Activity Category"}
                  </label>
                  <select
                    value={alertCat}
                    onChange={(e) => setAlertCat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
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
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                    {isRtl ? "المحافظة" : "Governorate"}
                  </label>
                  <select
                    value={alertGov}
                    onChange={(e) => setAlertGov(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
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
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                    {isRtl ? "المدينة أو الحي" : "City or District"}
                  </label>
                  <input
                    type="text"
                    placeholder={isRtl ? "مثال: مدينة نصر" : "e.g. City"}
                    value={alertCity}
                    onChange={(e) => setAlertCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                    {isRtl ? "تفضيل الجنس" : "Gender Preference"}
                  </label>
                  <select
                    value={alertGender}
                    onChange={(e) => setAlertGender(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
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
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <Plus size={18} className="text-amber-500" />
                {isRtl ? "إضافة منشور نشاط جديد" : "Create New Activity Post"}
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            {createSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold font-cairo">
                <CheckCircle size={20} />
                <span>{isRtl ? "تم نشر النشاط بنجاح وتنبيه المشتركين المهتمين!" : "Activity published successfully and alerts sent!"}</span>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-4">
                {createError && (
                  <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold font-cairo">
                    <AlertTriangle size={16} />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "عنوان النشاط" : "Activity Title"} *
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? "مثال: نلعب كورة قدم في الجيزة" : "e.g. Football match"}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                      required
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "الوصف والتفاصيل" : "Description / Details"} *
                    </label>
                    <textarea
                      placeholder={isRtl ? "اكتب تفاصيل الفعالية، موعد التجمع، والشروط..." : "Details of the activity..."}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "التصنيف" : "Category"} *
                    </label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                      required
                    >
                      <option value="">{isRtl ? "اختر..." : "Choose..."}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {isRtl ? c.nameAr : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "الحد الأقصى للمشاركين" : "Max Participants"} *
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={newMaxPart}
                      onChange={(e) => setNewMaxPart(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "المحافظة" : "Governorate"} *
                    </label>
                    <select
                      value={newGov}
                      onChange={(e) => setNewGov(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                      required
                    >
                      <option value="">{isRtl ? "اختر..." : "Choose..."}</option>
                      {EGYPTIAN_GOVERNORATES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "المدينة أو الحي" : "City / District"} *
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? "مثال: مدينة نصر" : "e.g. Heliopolis"}
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "التاريخ" : "Date"} *
                    </label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "توقيت التجمع" : "Time Slot"} *
                    </label>
                    <input
                      type="text"
                      placeholder={isRtl ? "مثال: 07:00 مساءً" : "e.g. 07:00 PM"}
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                      required
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                      {isRtl ? "تفضيل الجنس" : "Target Gender"}
                    </label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                    >
                      <option value="ALL">{isRtl ? "مفتوح للجميع" : "All"}</option>
                      <option value="MALES_ONLY">{isRtl ? "ذكور فقط" : "Males Only"}</option>
                      <option value="FEMALES_ONLY">{isRtl ? "إناث فقط" : "Females Only"}</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-cairo">
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
