"use client";

import { useEffect, useRef } from "react";

export default function XListFeed({ darkMode }) {
  const containerRef = useRef(null);

  useEffect(() => {
    function renderTimeline() {
      if (window.twttr?.widgets && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
    }

    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      script.onload = renderTimeline;
      document.body.appendChild(script);
    } else {
      renderTimeline();
    }
  }, [darkMode]);

  return (
    <div ref={containerRef}>
      <a
        className="twitter-timeline"
        data-height="520"
        data-theme={darkMode ? "dark" : "light"}
        href="https://x.com/i/lists/2066898933926789487"
      >
        Posts from That Guy Rocked
      </a>
    </div>
  );
}
