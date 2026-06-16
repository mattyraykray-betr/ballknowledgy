"use client";

import { useEffect } from "react";

export default function XListFeed({ darkMode }) {
  useEffect(() => {
    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, []);

  return (
    <a
      className="twitter-timeline"
      data-height="520"
      data-theme={darkMode ? "dark" : "light"}
      href="https://x.com/i/lists/2066890467086598373"
    >
      Latest posts
    </a>
  );
}
