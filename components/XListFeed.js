"use client";

import { useEffect, useRef } from "react";

export default function XListFeed({ darkMode }) {
  const containerRef = useRef(null);

  useEffect(() => {
    function loadWidgets() {
      if (window.twttr?.widgets && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
    }

    const existingScript = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]'
    );

    if (existingScript) {
      loadWidgets();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    script.onload = loadWidgets;
    document.body.appendChild(script);
  }, [darkMode]);

  return (
    <div ref={containerRef}>
      <a
        className="twitter-timeline"
        data-height="520"
        data-theme={darkMode ? "dark" : "light"}
        data-chrome="noheader nofooter noborders transparent"
        href="https://twitter.com/i/lists/2066890467086598373"
      >
        Latest posts
      </a>
    </div>
  );
}
