import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

const theme = { text: "#ffffff", muted: "#b5b5b5", border: "#333333" };

export default function SocialsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: 16, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#b5b5b5" }}>← Back Home</Link>

        <h1 style={{ fontFamily: "'Roboto Slab', Rockwell, serif" }}>Socials</h1>

        <p>Follow That Guy Rocked and related projects.</p>

        <h2>X / Twitter</h2>
        <ul
          style={{
            listStyle: "none",
            paddingLeft: 0,
            marginTop: 8,
          }}
        >
          <li style={{ marginBottom: 10 }}>
            »
            {" "}
            <a
              href="https://x.com/ThatGuyRocked"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff" }}
            >
              @ThatGuyRocked
            </a>
          </li>
        
          <li style={{ marginBottom: 10 }}>
            »
            {" "}
            <a
              href="https://x.com/NBAGuyRocked"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff" }}
            >
              @NBAGuyRocked
            </a>
          </li>
        
          <li style={{ marginBottom: 10 }}>
            »
            {" "}
            <a
              href="https://x.com/NFLGuyRocked"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff" }}
            >
              @NFLGuyRocked
            </a>
          </li>
          
          <li style={{ marginBottom: 10 }}>
            »
            {" "}
            <a
              href="https://x.com/MLBGuyRocked"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff" }}
            >
              @MLBGuyRocked
            </a>
          </li>
            
          <li style={{ marginBottom: 10 }}>
            »
            {" "}
            <a
              href="https://x.com/ThatGuyRockedU"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff" }}
            >
              @ThatGuyRockedU
            </a>
          </li>
        </ul>

        <h2>Facebook</h2>
        <ul
          style={{
            listStyle: "none",
            paddingLeft: 0,
            marginTop: 8,
          }}
        >
          <li style={{ marginBottom: 10 }}>
            »
            {" "}
            <a
              href="https://www.facebook.com/profile.php?id=61590278446737"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff" }}
            >
              That Guy Rocked
            </a>
          </li>
        </ul>                

        <h2>Instagram</h2>
        <ul
          style={{
            listStyle: "none",
            paddingLeft: 0,
            marginTop: 8,
          }}
        >
          <li style={{ marginBottom: 10 }}>
            »
            {" "}
            <a
              href="https://www.instagram.com/thatguyrockedig/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff" }}
            >
              That Guy Rocked
            </a>
          </li>
        </ul>  

        <SiteFooter theme={theme} />
      </div>
    </main>
  );
}
