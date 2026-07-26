"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  type ReaderLanguage,
  READER_LANGUAGE_OPTIONS,
  TTS_LANGUAGE_CONFIG,
} from "@/utils/tts-language";

interface LanguageSelectorProps {
  currentLanguage: ReaderLanguage;
  onLanguageChange: (language: ReaderLanguage) => void;
  variant?: "icon" | "button";
  fontFamily?: string;
  label?: string;
  dropdownPosition?: "down" | "up";
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  variant = "button",
  fontFamily = "Verdana, Arial, Helvetica, sans-serif",
  label,
  dropdownPosition = "down",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = label || TTS_LANGUAGE_CONFIG[currentLanguage].label;

  return (
    <div className="relative" ref={dropdownRef}>
      {variant === "icon" ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors text-sm font-bold px-2"
          title={`Language: ${TTS_LANGUAGE_CONFIG[currentLanguage].label}`}
        >
          {currentLabel}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-row items-center justify-center gap-2 px-4 py-4 border-2 border-gray-400 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors w-full"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span
            className="font-semibold text-sm md:text-base text-gray-600 dark:text-gray-400"
            style={{ fontFamily }}
          >
            {currentLabel}
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden ${
            variant === "icon" ? "right-0" : ""
          } ${dropdownPosition === "up" ? "bottom-full mb-2" : "mt-2"}`}
        >
          {READER_LANGUAGE_OPTIONS.map((language) => (
            <button
              key={language}
              onClick={() => {
                onLanguageChange(language);
                setIsOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-blue-50 dark:hover:bg-blue-900 ${
                currentLanguage === language
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {TTS_LANGUAGE_CONFIG[language].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
