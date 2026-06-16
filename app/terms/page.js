import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

const theme = { text: "#ffffff", muted: "#b5b5b5", border: "#333333" };

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: 16, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#b5b5b5" }}>← Back Home</Link>

        <h1 style={{ fontFamily: "'Roboto Slab', Rockwell, serif" }}>Terms of Use</h1>
        <p>Last updated: June 2026</p>

        <p>By using thatguyrocked.com, you agree to use the site for personal, non-commercial entertainment purposes only.</p>

        <h2>Independent Project</h2>
        <p>thatguyrocked.com is an independent project and is not affiliated with, endorsed by, or sponsored by the National Basketball Association (the NBA), the Women&apos;s National Basketball Association (the WNBA), the National Football League (the NFL), Major League Baseball (the MLB), the National Collegiate Athletic Association (the NCAA), or any professional or collegiate sports team, league, conference, or governing body.</p>

        <h2>Gameplay and Scores</h2>
        <p>Scores, leaderboards, challenges, player data, and game results are provided for entertainment. We may change, correct, remove, or reset content or scores at any time.</p>

        <h2>User Profiles</h2>
        <p>Profiles are optional and use a username and passkey system. You are responsible for saving your passkey. If you lose it, we may not be able to recover your profile.</p>

        <h2>Acceptable Use</h2>
        <p>You agree not to abuse, interfere with, scrape, reverse engineer, attack, or misuse the site or its data.</p>

        <h2>No Warranty</h2>
        <p>The site is provided “as is” without warranties of any kind. We do not guarantee uninterrupted availability or error-free data.</p>

        <h2>Contact</h2>
        <p>Questions can be sent through the Contact page.</p>

        <SiteFooter theme={theme} />
      </div>
    </main>
  );
}
