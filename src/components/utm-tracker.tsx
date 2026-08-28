"use client";

import { useEffect } from "react";

export function UtmTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    let hasUtm = false;

    for (const key of utmKeys) {
      const value = params.get(key);
      if (value) {
        sessionStorage.setItem(key, value);
        hasUtm = true;
      }
    }

    if (hasUtm) {
      sessionStorage.setItem("utm_timestamp", new Date().toISOString());
      sessionStorage.setItem("utm_landing_page", window.location.pathname);
    }
  }, []);

  return null;
}
