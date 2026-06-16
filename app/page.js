"use client";

import Link from "next/link";
import SiteFooter from "../components/SiteFooter";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteNav from "../components/SiteNav";
import ProfileModal from "../components/ProfileModal";
import XListFeed from "../components/XListFeed";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  
  const theme = useMemo(() => {
    return darkMode
      ? { bg: "#050505", card: "#181818", pane: "#242424", text: "#ffffff", muted: "#b5b5b5", border: "#333333", input: "#0f0f0f" }
      : { bg: "#ffffff", card: "#f6f6f6", pane: "#eeeeee", text: "#111111", muted: "#555555", border: "#d8d8d8", input: "#ffffff" };
  }, [darkMode]);
  
  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null);
      return;
    }
  
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
  
    setProfile(data || null);
  }
  
  useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    setDarkMode(Boolean(prefersDark));
  
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;
      setUser(currentUser);
      loadProfile(currentUser?.id);
    }
  
    loadUser();
  
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      loadProfile(currentUser?.id);
    });
  
    return () => listener?.subscription?.unsubscribe();
  }, []);
  
  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: 16,
      }}
    >

    <div style={{ maxWidth: 520, margin: "0 auto 10px", display: "flex", justifyContent: "flex-end" }}>
      <button
        style={{
          width: 36,
          height: 36,
          border: `1px solid ${theme.border}`,
          background: theme.card,
          color: theme.text,
          borderRadius: 6,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setShowMenu(true)}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
    </div>
    
    <SiteNav
      showMenu={showMenu}
      setShowMenu={setShowMenu}
      setShowProfile={setShowProfile}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      theme={theme}
      user={user}
      profile={profile}
      username={profile?.username || username}
    />
    
    <ProfileModal
      show={showProfile}
      onClose={() => setShowProfile(false)}
      user={user}
      setUser={setUser}
      darkMode={darkMode}
      theme={theme}
    />
      
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Roboto Slab', Rockwell, serif", fontSize: 36, marginBottom: 4 }}>That Guy Rocked</h1>
        <p style={{ color: theme.muted, marginBottom: 20 }}>
          Daily sports trivia games for sickos.
        </p>

        <section style={{ marginTop: 18 }}>
          <div
            style={{
              color: theme.muted,
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Trivia Games
          </div>
        
          <div style={{ display: "grid", gap: 12 }}>
            <Link
              href="/name-a-dude"
              style={{
                color: "inherit",
                textDecoration: "none",
                border: `1px solid ${theme.border}`,
                background: theme.card,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  recent_patient
                </span>
        
                <div style={{ fontSize: 22, fontWeight: 900 }}>Name a Dude</div>
              </div>
        
              <div style={{ color: theme.muted, marginTop: 4 }}>
                Get a random team and season. Name one player from that roster.
              </div>
            </Link>
        
            <Link
              href="/ladder-golf"
              style={{
                color: "inherit",
                textDecoration: "none",
                border: `1px solid ${theme.border}`,
                background: theme.card,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  tools_ladder
                </span>
        
                <div style={{ fontSize: 22, fontWeight: 900 }}>Ladder Golf</div>
              </div>
        
              <div style={{ color: theme.muted, marginTop: 4 }}>
                Name players lower than the previous career stat value.
              </div>
            </Link>
        
            <Link
              href="/ball-knowledgy"
              style={{
                color: "inherit",
                textDecoration: "none",
                border: `1px solid ${theme.border}`,
                background: theme.card,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  quiz
                </span>
        
                <div style={{ fontSize: 22, fontWeight: 900 }}>Ball Knowledgy</div>
              </div>
        
              <div style={{ color: theme.muted, marginTop: 4 }}>
                Guess the player from team, era, stats, and hints.
              </div>
            </Link>
          </div>
        </section>
        
        <section
          style={{
            border: `1px solid ${theme.border}`,
            background: theme.card,
            borderRadius: 10,
            padding: 16,
            marginTop: 18,
          }}
        >
          <div
            style={{
              color: theme.muted,
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Latest From Us
          </div>
        
          <a
            href="https://x.com/i/lists/2066898933926789487"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.text,
              fontSize: 18,
              fontWeight: 900,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            𝕏 View our latest posts
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              open_in_new
            </span>
          </a>
        
          <div style={{ color: theme.muted, marginTop: 6, fontSize: 13 }}>
            Updates from all our accounts in one public X list.
          </div>
        </section>
                
        <SiteFooter theme={theme} />                
      </div>
    </main>
  );
}
