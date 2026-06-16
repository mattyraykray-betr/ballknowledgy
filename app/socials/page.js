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
        <ul>
          <li>
            <a href="https://x.com/ThatGuyRocked" target="_blank" rel="noopener noreferrer">
              @ThatGuyRocked
            </a>
          </li>
        
          <li>
            <a href="https://x.com/NBAGuyRocked" target="_blank" rel="noopener noreferrer">
              @NBAGuyRocked
            </a>
          </li>
        
          <li>
            <a href="https://x.com/NFLRocked" target="_blank" rel="noopener noreferrer">
              @NFLRocked
            </a>
          </li>
          
          <li>
            <a href="https://x.com/MLBRocked" target="_blank" rel="noopener noreferrer">
              @MLBRocked
            </a>
          </li>
            
          <li>
            <a href="https://x.com/ThatGuyRockedU" target="_blank" rel="noopener noreferrer">
              @ThatGuyRockedU
            </a>
          </li>
        </ul>             

        <h2>Facebook</h2>
        <p>Add your Facebook pages here.</p>

        <h2>Instagram</h2>
        <p>Add your Instagram accounts here.</p>

        <SiteFooter theme={theme} />
      </div>
    </main>
  );
}
