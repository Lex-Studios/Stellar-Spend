"use client";

import React from "react";
import { useI18n } from "./provider";
import { Language } from "./types";

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  zh: "中文",
  ar: "AR",
  pt: "PT",
  sw: "SW",
};

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const languages = Object.keys(LANGUAGE_LABELS) as Language[];

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      aria-label="Select language"
      className="bg-[#0a0a0a] border border-[#333333] text-[#777777] text-xs px-2 py-1 tracking-widest focus:outline-none focus:border-[#c9a962] hover:border-[#555555] transition-colors cursor-pointer"
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_LABELS[lang]}
        </option>
      ))}
    </select>
  );
}
