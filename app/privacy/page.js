import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

const theme = { text: "#ffffff", muted: "#b5b5b5", border: "#333333" };

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: 16, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#b5b5b5" }}>← Back Home</Link>

        <h1 style={{ fontFamily: "'Roboto Slab', Rockwell, serif" }}>Privacy Policy</h1>
        <p>Last updated: June 2026</p>

        <p>We collect limited information needed to operate the games, profiles, scores, and leaderboards.</p>

        <h2>Information We Collect</h2>
        <p>If you create a profile, we may store your username, avatar, passkey, game scores, guesses, completion history, and leaderboard results.</p>

        <h2>No Email Required</h2>
        <p>Profiles do not require an email address. Your passkey is used to access your profile on another device.</p>

        <h2>Analytics</h2>
        <p>We may use analytics tools to understand site traffic, popular pages, devices, browsers, and general usage patterns.</p>

        <h2>How We Use Information</h2>
        <p>We use information to save scores, display leaderboards, improve games, troubleshoot bugs, and understand site performance.</p>
        <p>Think of it as an old school arcade game. You get a high score and add your initials or name to show your friends. That is it. We don't collect your email or phone number. We don't want your email or phone number!</p>
  
        <h2>Data Sharing</h2>
        <p>We do not sell personal information. We may use service providers such as hosting, database, analytics, or storage providers to operate the site.</p>

        <h2>Contact</h2>
        <p>Questions can be sent through the Contact page.</p>

        <SiteFooter theme={theme} />
      </div>
    </main>
  );
}
