"use client";

import Link from "next/link";

export default function SiteFooter({ theme }) {
  const t = theme || {
    text: "#ffffff",
    muted: "#b5b5b5",
    border: "#333333",
  };

  return (
    <footer style={{ borderTop: `1px solid ${t.border}`, marginTop: 28, padding: "18px 0 8px", color: t.muted, fontSize: 11 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <Link href="/terms" style={{ color: t.text }}>Terms</Link>
        <Link href="/privacy" style={{ color: t.text }}>Privacy</Link>
        <Link href="/cookies" style={{ color: t.text }}>Cookies</Link>
        <Link href="/contact" style={{ color: t.text }}>Contact</Link>
        <Link href="/socials" style={{ color: t.text }}>Socials</Link>
      </div>

      <div style={{ lineHeight: 1.4 }}>
        thatguyrocked.com is an independent project and is not affiliated with,
        endorsed by, or sponsored by the National Basketball Association (the NBA),
        the Women&apos;s National Basketball Association (the WNBA), the National Football
        League (the NFL), Major League Baseball (the MLB), the National Collegiate 
        Athletic Association (the NCAA), or any professional or collegiate sports team, 
        league, conference, or governing body.
      </div>

      <div style={{ marginTop: 10 }}>© 2026 That Guy Rocks | TGR Partners LLC. All Rights Reserved.</div>
    </footer>
  );
}
