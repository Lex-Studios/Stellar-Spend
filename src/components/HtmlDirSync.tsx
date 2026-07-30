"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/provider";

/** Syncs the <html> element's lang and dir attributes with the active language. */
export function HtmlDirSync() {
  const { language, isRTL } = useI18n();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [language, isRTL]);

  return null;
}
