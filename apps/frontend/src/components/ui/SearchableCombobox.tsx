// apps/frontend/src/components/ui/SearchableCombobox.tsx
"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";
import { normalizeArabicText } from "@/lib/constants";

interface SearchableComboboxProps {
  label?: string;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
  className?: string;
  allowCustom?: boolean;
  id?: string;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  label,
  placeholder = "ابحث أو اختر...",
  options,
  value,
  onChange,
  error,
  className = "",
  allowCustom = true,
  id: customId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const generatedId = useId();
  const inputId = customId || generatedId;
  const listboxId = `${inputId}-listbox`;
  const errorId = `${inputId}-error`;

  // Sync internal search query with current value when closed or initial
  useEffect(() => {
    setSearchQuery(value || "");
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options with normalized Arabic text
  const normalizedQuery = normalizeArabicText(searchQuery);
  const filteredOptions = options.filter((opt) =>
    normalizeArabicText(opt).includes(normalizedQuery)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!isOpen) setIsOpen(true);
    if (allowCustom) {
      onChange(val);
    }
  };

  const handleSelect = (opt: string) => {
    onChange(opt);
    setSearchQuery(opt);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 font-cairo">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-10 rounded-xl border bg-surface border-border px-3.5 pe-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-cairo text-text ${
            error ? "border-status-danger" : ""
          }`}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label="عرض خيارات القائمة"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute end-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {/* Dropdown Options List */}
        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-50 start-0 end-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface shadow-xl font-cairo py-1 animate-fadeIn"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  role="option"
                  aria-selected={opt === value}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                    opt === value
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-surface-secondary text-text"
                  }`}
                >
                  <span>{opt}</span>
                  {opt === value && <Check size={16} className="text-amber-500 shrink-0" aria-hidden="true" />}
                </div>
              ))
            ) : (
              <div className="px-3.5 py-2 text-sm text-slate-400 text-center">لا توجد نتائج مطابقة</div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-red-500 font-cairo">
          {error}
        </p>
      )}
    </div>
  );
};
