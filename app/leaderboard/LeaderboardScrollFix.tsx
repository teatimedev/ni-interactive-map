"use client";

import { useEffect } from "react";

export function LeaderboardScrollFix() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Override the map's overflow:hidden / height:100vh on both html and body
    html.style.overflow = "auto";
    html.style.height = "auto";
    body.style.overflow = "auto";
    body.style.height = "auto";
    body.style.position = "static";
    // Ensure mobile touch scrolling works
    html.style.setProperty("-webkit-overflow-scrolling", "touch");
    body.style.setProperty("-webkit-overflow-scrolling", "touch");
    body.style.overscrollBehavior = "auto";
    html.style.overscrollBehavior = "auto";

    return () => {
      html.style.overflow = "";
      html.style.height = "";
      body.style.overflow = "";
      body.style.height = "";
      body.style.position = "";
      html.style.removeProperty("-webkit-overflow-scrolling");
      body.style.removeProperty("-webkit-overflow-scrolling");
      body.style.overscrollBehavior = "";
      html.style.overscrollBehavior = "";
    };
  }, []);
  return null;
}
