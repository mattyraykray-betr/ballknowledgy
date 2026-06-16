import Link from "next/link";
import SiteFooter from "../components/SiteFooter";

export default function HomePage() {
  const theme = {
    text: "#ffffff",
    muted: "#b5b5b5",
    border: "#333333",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Roboto Slab', Rockwell, serif", fontSize: 36, marginBottom: 4 }}>That Guy Rocked</h1>
        <p style={{ color: "#b5b5b5", marginBottom: 20 }}>
          Daily basketball games for sickos.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <Link
            href="/ball-knowledgy"
            style={{
              color: "inherit",
              textDecoration: "none",
              border: "1px solid #333",
              background: "#181818",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28 }}
              >
                quiz
              </span>
            
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                Ball Knowledgy
              </div>
            </div>
            <div style={{ color: "#b5b5b5", marginTop: 4 }}>
              Guess the player from team, era, stats, and hints.
            </div>
          </Link>

          <Link
            href="/ladder-golf"
            style={{
              color: "inherit",
              textDecoration: "none",
              border: "1px solid #333",
              background: "#181818",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28 }}
              >
                tools_ladder
              </span>
            
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                Ladder Golf
              </div>
            </div>
            <div style={{ color: "#b5b5b5", marginTop: 4 }}>
              Name players lower than the previous career stat value.
            </div>
          </Link>

          <Link
            href="/name-a-dude"
            style={{
              color: "inherit",
              textDecoration: "none",
              border: "1px solid #333",
              background: "#181818",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28 }}
              >
                recent_patient
              </span>
          
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                Name a Dude
              </div>
            </div>
          
            <div style={{ color: "#b5b5b5", marginTop: 4 }}>
              Get a random team and season. Name one player from that roster.
            </div>
          </Link>                
        </div>
        <SiteFooter theme={theme} />                
      </div>
    </main>
  );
}
