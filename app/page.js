"use client";

import Link from "next/link";
import SiteFooter from "../components/SiteFooter";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteNav from "../components/SiteNav";
import ProfileModal from "../components/ProfileModal";

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
        background: "#050505",
        color: "#ffffff",
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
