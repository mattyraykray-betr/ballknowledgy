import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

const theme = { text: "#ffffff", muted: "#b5b5b5", border: "#333333" };

export default function CookiesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: 16, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#b5b5b5" }}>← Back Home</Link>

        <h1 style={{ fontFamily: "'Roboto Slab', Rockwell, serif" }}>Cookie Policy</h1>
        <p>Last updated: June 2026</p>

        <p>thatguyrocked.com may use cookies, local storage, and similar technologies to keep you logged in, save preferences, support profiles, and measure site usage.</p>

        <h2>Essential Storage</h2>
        <p>Some storage is necessary for profile sessions, passkey recovery, dark/light mode preferences, and basic site functionality.</p>

        <h2>Analytics</h2>
        <p>We may use analytics cookies or scripts to understand traffic and improve the site.</p>

        <h2>Third-Party Embeds</h2>
        <p>If we embed social media content, those platforms may use their own cookies or tracking technologies.</p>

        <h2>Managing Cookies</h2>
        <p>You can control cookies and site data through your browser settings. Blocking cookies may affect profile and gameplay features.</p>

        <SiteFooter theme={theme} />
      </div>
    </main>
  );
}
