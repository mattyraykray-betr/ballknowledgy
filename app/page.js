"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function todayLocal() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(() => {
    return darkMode
      ? {
          bg: "#050505",
          card: "#181818",
          pane: "#242424",
          text: "#ffffff",
          muted: "#b5b5b5",
          border: "#333333",
        }
      : {
          bg: "#ffffff",
          card: "#f4f4f4",
          pane: "#eeeeee",
          text: "#111111",
          muted: "#555555",
          border: "#d8d8d8",
        };
  }, [darkMode]);

  async function loadChallenges(dateValue) {
    setLoading(true);

    const { data, error } = await supabase
      .from("nba_trivia_challenges")
      .select(`
        id,
        challenge_date,
        daily_slot,
        difficulty,
        player_id,
        season_year,
        season_label,
        decade,
        season_range,
        starting_clue_json,
        hint_1_json,
        hint_2_json,
        hint_3_json,
        team:nba_teams(display_name, abbreviation),
        player:nba_players(full_name)
      `)
      .eq("challenge_date", dateValue)
      .eq("is_active", true)
      .order("daily_slot", { ascending: true });

    if (error) {
      console.error(error);
      setChallenges([]);
    } else {
      setChallenges(data || []);
      setActiveChallenge(data?.[0] || null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadChallenges(selectedDate);
  }, [selectedDate]);

  const styles = {
    page: {
      minHeight: "100vh",
      background: theme.bg,
      color: theme.text,
      fontFamily:
        'Arial, Helvetica, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: 0,
      margin: 0,
    },
    wrap: {
      maxWidth: 520,
      margin: "0 auto",
      padding: "16px",
    },
    topbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `2px solid ${theme.border}`,
      paddingBottom: 12,
      marginBottom: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: 900,
      margin: 0,
      letterSpacing: "-0.04em",
      textTransform: "uppercase",
    },
    sub: {
      color: theme.muted,
      fontSize: 13,
      marginTop: 2,
    },
    button: {
      border: `1px solid ${theme.border}`,
      background: theme.card,
      color: theme.text,
      padding: "9px 11px",
      fontWeight: 800,
      borderRadius: 0,
      cursor: "pointer",
    },
    dateInput: {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px",
      border: `1px solid ${theme.border}`,
      background: theme.card,
      color: theme.text,
      borderRadius: 0,
      fontSize: 16,
      marginBottom: 14,
    },
    tabs: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 8,
      marginBottom: 16,
    },
    tab: {
      padding: "12px 8px",
      border: `1px solid ${theme.border}`,
      background: theme.card,
      color: theme.text,
      borderRadius: 0,
      fontWeight: 900,
      cursor: "pointer",
      textAlign: "center",
      textTransform: "uppercase",
      fontSize: 13,
    },
    activeTab: {
      background: "#003594",
      color: "#ffffff",
      border: "1px solid #003594",
    },
    card: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 0,
      padding: 16,
      marginBottom: 14,
    },
    label: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 5,
    },
    big: {
      fontSize: 23,
      fontWeight: 900,
      marginBottom: 2,
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 8,
      marginTop: 12,
    },
    statBox: {
      background: theme.pane,
      border: `1px solid ${theme.border}`,
      padding: 10,
      textAlign: "center",
    },
    statLabel: {
      fontSize: 11,
      color: theme.muted,
      fontWeight: 900,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 900,
      marginTop: 3,
    },
    orange: {
      color: "#EF3B24",
    },
  };

  const clue = activeChallenge?.starting_clue_json || {};

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>NBA Trivia</h1>
            <div style={styles.sub}>Daily player challenge</div>
          </div>

          <button style={styles.button} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>

        <input
          style={styles.dateInput}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        {loading ? (
          <div style={styles.card}>Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div style={styles.card}>No challenges found for this date.</div>
        ) : (
          <>
            <div style={styles.tabs}>
              {challenges.map((c) => (
                <button
                  key={c.id}
                  style={{
                    ...styles.tab,
                    ...(activeChallenge?.id === c.id ? styles.activeTab : {}),
                  }}
                  onClick={() => setActiveChallenge(c)}
                >
                  #{c.daily_slot}
                  <br />
                  {c.difficulty}
                </button>
              ))}
            </div>

            {activeChallenge && (
              <>
                <section style={styles.card}>
                  <div style={styles.label}>Challenge</div>
                  <div style={styles.big}>
                    {activeChallenge.team?.display_name || "Unknown Team"}
                  </div>
                  <div style={styles.sub}>
                    {activeChallenge.decade} · {activeChallenge.season_range}
                  </div>

                  <div style={styles.statGrid}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>PTS</div>
                      <div style={styles.statValue}>
                        {clue.points_per_game ?? "-"}
                      </div>
                    </div>

                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>REB</div>
                      <div style={styles.statValue}>
                        {clue.rebounds_per_game ?? "-"}
                      </div>
                    </div>

                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>AST</div>
                      <div style={styles.statValue}>
                        {clue.assists_per_game ?? "-"}
                      </div>
                    </div>
                  </div>
                </section>

                <section style={styles.card}>
                  <div style={styles.label}>Guess the player</div>
                  <div style={{ color: theme.muted, fontSize: 14 }}>
                    Player search, timer, hints, scoring, and leaderboard come
                    next.
                  </div>
                </section>

                <section style={styles.card}>
                  <div style={styles.label}>Debug answer for now</div>
                  <div style={{ ...styles.big, ...styles.orange }}>
                    {activeChallenge.player?.full_name}
                  </div>
                  <div style={styles.sub}>
                    {activeChallenge.season_label} · Player ID{" "}
                    {activeChallenge.player_id}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
