import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

const theme = { text: "#ffffff", muted: "#b5b5b5", border: "#333333" };

export default function ContactPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: 16, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#b5b5b5" }}>← Back Home</Link>

        <h1 style={{ fontFamily: "'Roboto Slab', Rockwell, serif" }}>Contact Us</h1>

        <p>Questions, bug reports, feature ideas, or partnership inquiries?</p>

        <p>
          Email:{" "}
          <a href="mailto:thatguyrocked@gmail.com" style={{ color: "#fff" }}>
            thatguyrocked@gmail.com
          </a>
        </p>

        <p style={{ color: "#b5b5b5" }}>
          If you are reporting a bug, please include the game, device, browser, and what happened.
        </p>

        <SiteFooter theme={theme} />
      </div>
    </main>
  );
}
