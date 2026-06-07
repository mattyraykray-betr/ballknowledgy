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

function formatStat(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(1);
}

function calculateScore({ secondsElapsed, wrongGuessCount, hintsUsed }) {
  const base = 1000;
  const timePenalty = Math.floor(secondsElapsed * 4);
  const wrongPenalty = wrongGuessCount * 100;
  const hintPenalty =
    hintsUsed === 0 ? 0 : hintsUsed === 1 ? 75 : hintsUsed === 2 ? 175 : 350;

  return Math.max(0, base - timePenalty - wrongPenalty - hintPenalty);
}

function renderHint(hint) {
  if (!hint || Object.keys(hint).length === 0) return null;

  if (hint.label && hint.value) return `${hint.label}: ${hint.value}`;
  if (hint.type && hint.value) return `${hint.type}: ${hint.value}`;
  if (hint.text) return hint.text;

  if (hint.teammates && Array.isArray(hint.teammates)) {
    return `Season: ${hint.season_label || hint.season_year}. Teammates: ${hint.teammates.join(", ")}`;
  }

  return Object.entries(hint)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join(" · ");
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [query, setQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [hintsShown, setHintsShown] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [score, setScore] = useState(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [message, setMessage] = useState("");

  const theme = useMemo(() => {
    return darkMode
      ? {
          bg: "#050505",
          card: "#181818",
          pane: "#242424",
          text: "#ffffff",
          muted: "#b5b5b5",
          border: "#333333",
          input: "#0f0f0f",
        }
      : {
          bg: "#ffffff",
          card: "#f6f6f6",
          pane: "#eeeeee",
          text: "#111111",
          muted: "#555555",
          border: "#d8d8d8",
          input: "#ffffff",
        };
  }, [darkMode]);

  function resetGameState(challenge) {
    setActiveChallenge(challenge);
    setQuery("");
    setPlayerResults([]);
    setSelectedPlayer(null);
    setWrongGuesses([]);
    setHintsShown(0);
    setIsSolved(false);
    setScore(null);
    setStartedAt(Date.now());
    setSecondsElapsed(0);
    setMessage("");
  }

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
      setActiveChallenge(null);
    } else {
      setChallenges(data || []);
      resetGameState(data?.[0] || null);
    }

    setLoading(false);
  }

  async function searchPlayers(value) {
    setQuery(value);
    setSelectedPlayer(null);

    if (value.trim().length < 2) {
      setPlayerResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("nba_players")
      .select("id, full_name")
      .ilike("full_name", `%${value.trim()}%`)
      .order("full_name", { ascending: true })
      .limit(8);

    if (error) {
      console.error(error);
      setPlayerResults([]);
    } else {
      setPlayerResults(data || []);
    }
  }

  function submitGuess() {
    if (!activeChallenge || !selectedPlayer || isSolved) return;

    if (selectedPlayer.id === activeChallenge.player_id) {
      const finalSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const finalScore = calculateScore({
        secondsElapsed: finalSeconds,
        wrongGuessCount: wrongGuesses.length,
        hintsUsed: hintsShown,
      });

      setIsSolved(true);
      setSecondsElapsed(finalSeconds);
      setScore(finalScore);
      setMessage("Correct.");
    } else {
      setWrongGuesses((prev) => [...prev, selectedPlayer]);
      setHintsShown((prev) => Math.min(3, prev + 1));
      setMessage("Incorrect. Hint revealed.");
      setQuery("");
      setSelectedPlayer(null);
      setPlayerResults([]);
    }
  }

  function revealHint() {
    if (hintsShown < 3 && !isSolved) {
      setHintsShown((prev) => prev + 1);
    }
  }

  useEffect(() => {
    loadChallenges(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!activeChallenge || isSolved) return;

    const timer = setInterval(() => {
      setSecondsElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeChallenge, startedAt, isSolved]);

  const styles = {
    page: {
      minHeight: "100vh",
      background: theme.bg,
      color: theme.text,
      fontFamily:
        'Arial, Helvetica, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      margin: 0,
    },
    wrap: {
      maxWidth: 520,
      margin: "0 auto",
      padding: "12px",
    },
    topbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `2px solid ${theme.border}`,
      paddingBottom: 10,
      marginBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 900,
      margin: 0,
      letterSpacing: "-0.04em",
      textTransform: "uppercase",
    },
    sub: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 2,
    },
    iconButton: {
      width: 36,
      height: 36,
      border: `1px solid ${theme.border}`,
      background: theme.card,
      color: theme.text,
      borderRadius: 0,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    dateInput: {
      width: 142,
      padding: "7px 8px",
      border: `1px solid ${theme.border}`,
      background: theme.input,
      color: theme.text,
      borderRadius: 0,
      fontSize: 12,
      marginBottom: 10,
    },
    tabs: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 6,
      marginBottom: 10,
    },
    tab: {
      padding: "7px 5px",
      border: `1px solid ${theme.border}`,
      background: theme.card,
      color: theme.text,
      borderRadius: 0,
      fontWeight: 900,
      cursor: "pointer",
      textAlign: "center",
      textTransform: "uppercase",
      fontSize: 10,
      lineHeight: 1.15,
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
      padding: 12,
      marginBottom: 10,
    },
    label: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 4,
    },
    big: {
      fontSize: 21,
      fontWeight: 900,
      marginBottom: 2,
    },
    metaRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      alignItems: "center",
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 4,
      marginTop: 10,
    },
    statBox: {
      background: theme.input,
      borderTop: `2px solid ${theme.border}`,
      padding: "6px 3px",
      textAlign: "center",
    },
    statLabel: {
      fontSize: 9,
      color: theme.muted,
      fontWeight: 900,
    },
    statValue: {
      fontSize: 14,
      fontWeight: 900,
      marginTop: 2,
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "11px",
      border: `1px solid ${theme.border}`,
      background: theme.input,
      color: theme.text,
      borderRadius: 0,
      fontSize: 15,
      marginBottom: 7,
    },
    resultList: {
      border: `1px solid ${theme.border}`,
      background: theme.input,
      marginBottom: 8,
    },
    resultItem: {
      padding: "10px",
      borderBottom: `1px solid ${theme.border}`,
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
    },
    primaryButton: {
      border: "1px solid #003594",
      background: "#003594",
      color: "#ffffff",
      padding: "11px",
      fontWeight: 900,
      borderRadius: 0,
      cursor: "pointer",
      textTransform: "uppercase",
      width: "100%",
      fontSize: 13,
    },
    disabledButton: {
      opacity: 0.45,
      cursor: "not-allowed",
    },
    hintButton: {
      border: "1px solid #EF3B24",
      background: "#EF3B24",
      color: "#ffffff",
      padding: "10px",
      fontWeight: 900,
      borderRadius: 0,
      cursor: "pointer",
      textTransform: "uppercase",
      width: "100%",
      fontSize: 13,
      marginTop: 8,
    },
    pillRow: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 8,
    },
    pill: {
      border: `1px solid ${theme.border}`,
      background: theme.pane,
      color: theme.text,
      padding: "5px 7px",
      fontSize: 10,
      fontWeight: 900,
      textTransform: "uppercase",
    },
    hintText: {
      borderLeft: "3px solid #EF3B24",
      paddingLeft: 9,
      marginTop: 8,
      fontSize: 13,
      fontWeight: 800,
      lineHeight: 1.35,
    },
    orange: {
      color: "#EF3B24",
    },
    message: {
      fontWeight: 900,
      color: "#EF3B24",
      marginTop: 8,
      fontSize: 13,
    },
  };

  const clue = activeChallenge?.starting_clue_json || {};
  const hint1 = activeChallenge?.hint_1_json || {};
  const hint2 = activeChallenge?.hint_2_json || {};
  const hint3 = activeChallenge?.hint_3_json || {};

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>NBA Trivia</h1>
            <div style={styles.sub}>Daily player challenge</div>
          </div>

          <button style={styles.iconButton} onClick={() => setDarkMode(!darkMode)}>
            <span className="material-symbols-outlined">
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
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
                  onClick={() => resetGameState(c)}
                >
                  #{c.daily_slot} · {c.difficulty}
                </button>
              ))}
            </div>

            {activeChallenge && (
              <>
                <section style={styles.card}>
                  <div style={styles.metaRow}>
                    <div>
                      <div style={styles.label}>Team</div>
                      <div style={styles.big}>
                        {activeChallenge.team?.display_name || "Unknown Team"}
                      </div>
                      <div style={styles.sub}>{activeChallenge.season_range}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={styles.label}>Timer</div>
                      <div style={{ ...styles.big, ...styles.orange }}>
                        {secondsElapsed}s
                      </div>
                    </div>
                  </div>

                  <button
                    style={{
                      ...styles.hintButton,
                      ...(isSolved || hintsShown >= 3 ? styles.disabledButton : {}),
                    }}
                    onClick={revealHint}
                    disabled={isSolved || hintsShown >= 3}
                  >
                    {hintsShown >= 3 ? "All Hints Revealed" : `Reveal Hint #${hintsShown + 1}`}
                  </button>

                  {hintsShown >= 1 && (
                    <div style={styles.hintText}>Hint 1: {renderHint(hint1)}</div>
                  )}
                  {hintsShown >= 2 && (
                    <div style={styles.hintText}>Hint 2: {renderHint(hint2)}</div>
                  )}
                  {hintsShown >= 3 && (
                    <div style={styles.hintText}>Hint 3: {renderHint(hint3)}</div>
                  )}
                </section>

                <section style={styles.card}>
                  <div style={styles.label}>Stat line</div>

                  <div style={styles.statGrid}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>PTS</div>
                      <div style={styles.statValue}>{formatStat(clue.points_per_game)}</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>REB</div>
                      <div style={styles.statValue}>{formatStat(clue.rebounds_per_game)}</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>AST</div>
                      <div style={styles.statValue}>{formatStat(clue.assists_per_game)}</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>STL</div>
                      <div style={styles.statValue}>{formatStat(clue.steals_per_game)}</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>BLK</div>
                      <div style={styles.statValue}>{formatStat(clue.blocks_per_game)}</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>GS</div>
                      <div style={styles.statValue}>{formatStat(clue.game_score)}</div>
                    </div>
                  </div>

                  <div style={styles.pillRow}>
                    <div style={styles.pill}>Misses {wrongGuesses.length}</div>
                    <div style={styles.pill}>Hints {hintsShown}</div>
                  </div>
                </section>

                {!isSolved && (
                  <section style={styles.card}>
                    <div style={styles.label}>Guess the player</div>

                    <input
                      style={styles.input}
                      value={query}
                      onChange={(e) => searchPlayers(e.target.value)}
                      placeholder="Search player..."
                    />

                    {playerResults.length > 0 && (
                      <div style={styles.resultList}>
                        {playerResults.map((p) => (
                          <div
                            key={p.id}
                            style={styles.resultItem}
                            onClick={() => {
                              setSelectedPlayer(p);
                              setQuery(p.full_name);
                              setPlayerResults([]);
                            }}
                          >
                            {p.full_name}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      style={{
                        ...styles.primaryButton,
                        ...(!selectedPlayer ? styles.disabledButton : {}),
                      }}
                      disabled={!selectedPlayer}
                      onClick={submitGuess}
                    >
                      Submit Guess
                    </button>

                    {message && <div style={styles.message}>{message}</div>}

                    {wrongGuesses.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={styles.label}>Wrong guesses</div>
                        <div style={styles.pillRow}>
                          {wrongGuesses.map((g, idx) => (
                            <div key={`${g.id}-${idx}`} style={styles.pill}>
                              {g.full_name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {isSolved && (
                  <section style={styles.card}>
                    <div style={styles.label}>Result</div>
                    <div style={styles.big}>
                      Correct: {activeChallenge.player?.full_name}
                    </div>
                    <div style={styles.sub}>
                      {activeChallenge.season_label} · {activeChallenge.team?.abbreviation}
                    </div>

                    <div style={styles.statGrid}>
                      <div style={styles.statBox}>
                        <div style={styles.statLabel}>Score</div>
                        <div style={{ ...styles.statValue, ...styles.orange }}>{score}</div>
                      </div>
                      <div style={styles.statBox}>
                        <div style={styles.statLabel}>Time</div>
                        <div style={styles.statValue}>{secondsElapsed}s</div>
                      </div>
                      <div style={styles.statBox}>
                        <div style={styles.statLabel}>Miss</div>
                        <div style={styles.statValue}>{wrongGuesses.length}</div>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
