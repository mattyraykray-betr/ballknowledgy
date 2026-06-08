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

function calculateScore({ secondsElapsed, wrongGuessCount, hintsUsed, gaveUp }) {
  if (gaveUp) return 0;
  return Math.max(
    0,
    1000 -
      Math.floor(secondsElapsed * 4) -
      wrongGuessCount * 100 -
      (hintsUsed === 0 ? 0 : hintsUsed === 1 ? 75 : hintsUsed === 2 ? 175 : 350)
  );
}

function cleanLabel(value) {
  if (!value) return "";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderHint(hint) {
  if (!hint || Object.keys(hint).length === 0) return null;

  if (hint.college_name) return `College: ${hint.college_name}`;
  if (hint.college && typeof hint.college === "string" && !/^\d+$/.test(hint.college)) {
    return `College: ${hint.college}`;
  }

  if (hint.label && hint.value) {
    const label = cleanLabel(hint.label);
    if (label.toLowerCase().includes("college") && /^\d+$/.test(String(hint.value))) {
      return "College: available after college-name lookup";
    }
    return `${label}: ${hint.value}`;
  }

  if (hint.type && hint.value) {
    const label = cleanLabel(hint.type);
    if (label.toLowerCase().includes("college") && /^\d+$/.test(String(hint.value))) {
      return "College: available after college-name lookup";
    }
    return `${label}: ${hint.value}`;
  }

  if (hint.text) return hint.text;

  const teammates =
    hint.teammates || hint.top_teammates || hint.players || hint.names || hint.value;

  if (Array.isArray(teammates)) {
    const cleaned = teammates
      .map((t) => {
        if (typeof t === "string") return t;
        if (t?.full_name) return t.full_name;
        if (t?.name) return t.name;
        if (t?.player_name) return t.player_name;
        return null;
      })
      .filter(Boolean);

    if (cleaned.length > 0) {
      return `Exact year: ${hint.season_label || hint.season_year || ""}. Teammates: ${cleaned.join(", ")}`;
    }
  }

  return Object.entries(hint)
    .filter(([key]) => !["player_id", "college_id", "team_id"].includes(key))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const arr = value
          .map((v) => {
            if (typeof v === "string") return v;
            if (v?.full_name) return v.full_name;
            if (v?.name) return v.name;
            if (v?.player_name) return v.player_name;
            return null;
          })
          .filter(Boolean);

        return `${cleanLabel(key)}: ${arr.join(", ")}`;
      }

      if (typeof value === "object") return null;
      return `${cleanLabel(key)}: ${value}`;
    })
    .filter(Boolean)
    .join(" · ");
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [query, setQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [hintsShown, setHintsShown] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [score, setScore] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
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

  function resetGameState(challenge, keepStarted = false) {
    setActiveChallenge(challenge);
    setQuery("");
    setPlayerResults([]);
    setSelectedPlayer(null);
    setWrongGuesses([]);
    setHintsShown(0);
    setIsSolved(false);
    setGaveUp(false);
    setScore(null);
    setSecondsElapsed(0);
    setMessage("");

    if (keepStarted && challenge) {
      setStartedAt(Date.now());
      setHasStarted(true);
    } else {
      setStartedAt(null);
      setHasStarted(false);
    }
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
        team:nba_teams(display_name, abbreviation, logo_url),
        player:nba_players(full_name, headshot_url),
        season:nba_player_seasons(
          games_played,
          games_started,
          minutes_per_game,
          points_per_game,
          rebounds_per_game,
          assists_per_game,
          steals_per_game,
          blocks_per_game,
          game_score,
          eff
        )
      `)
      .eq("challenge_date", dateValue)
      .eq("is_active", true)
      .order("daily_slot", { ascending: true });

    if (error) {
      console.error(error);
      setChallenges([]);
      resetGameState(null);
    } else {
      const rows = data || [];
      setChallenges(rows);

      const preferred =
        rows.find((c) => c.difficulty === selectedDifficulty) || rows[0] || null;

      resetGameState(preferred);
      if (preferred?.difficulty) setSelectedDifficulty(preferred.difficulty);
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

  function chooseDifficulty(difficulty) {
    setSelectedDifficulty(difficulty);
    const challenge = challenges.find((c) => c.difficulty === difficulty);
    resetGameState(challenge || null);
  }

  function startGame() {
    const challenge =
      challenges.find((c) => c.difficulty === selectedDifficulty) || challenges[0];

    if (!challenge) return;

    resetGameState(challenge, true);
  }

  function finishChallenge({ correct, gaveUpNow, outOfGuesses }) {
    const finalSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const finalScore = calculateScore({
      secondsElapsed: finalSeconds,
      wrongGuessCount: wrongGuesses.length,
      hintsUsed: hintsShown,
      gaveUp: gaveUpNow || outOfGuesses,
    });

    setIsSolved(correct);
    setGaveUp(gaveUpNow || outOfGuesses);
    setSecondsElapsed(finalSeconds);
    setScore(finalScore);

    if (correct) setMessage("Correct.");
    else if (gaveUpNow) setMessage("Answer revealed.");
    else setMessage("Out of guesses. Answer revealed.");
  }

  function submitGuess() {
    if (!activeChallenge || !selectedPlayer || isSolved || gaveUp) return;

    if (selectedPlayer.id === activeChallenge.player_id) {
      finishChallenge({ correct: true, gaveUpNow: false, outOfGuesses: false });
      return;
    }

    const nextWrongGuesses = [...wrongGuesses, selectedPlayer];
    setWrongGuesses(nextWrongGuesses);
    setHintsShown((prev) => Math.min(3, prev + 1));
    setQuery("");
    setSelectedPlayer(null);
    setPlayerResults([]);

    if (nextWrongGuesses.length >= 10) {
      finishChallenge({ correct: false, gaveUpNow: false, outOfGuesses: true });
    } else {
      setMessage("Incorrect. Hint revealed.");
    }
  }

  function revealHint() {
    if (hintsShown < 3 && !isSolved && !gaveUp) {
      setHintsShown((prev) => prev + 1);
    }
  }

  function giveUp() {
    if (!activeChallenge || isSolved || gaveUp) return;
    setHintsShown(3);
    finishChallenge({ correct: false, gaveUpNow: true, outOfGuesses: false });
  }

  useEffect(() => {
    loadChallenges(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (!activeChallenge || !hasStarted || isSolved || gaveUp || !startedAt) return;

    const timer = setInterval(() => {
      setSecondsElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeChallenge, startedAt, isSolved, gaveUp, hasStarted]);

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
    setupHero: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 0,
      padding: 14,
      marginBottom: 10,
    },
    setupTitle: {
      fontSize: 34,
      fontWeight: 950,
      letterSpacing: "-0.06em",
      textTransform: "uppercase",
      margin: "8px 0 2px",
      lineHeight: 0.95,
    },
    tabs: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 6,
      marginBottom: 10,
    },
    tab: {
      padding: "8px 5px",
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
    startButton: {
      border: "1px solid #EF3B24",
      background: "#EF3B24",
      color: "#ffffff",
      padding: "15px",
      fontWeight: 950,
      borderRadius: 0,
      cursor: "pointer",
      textTransform: "uppercase",
      width: "100%",
      fontSize: 18,
      letterSpacing: "-0.03em",
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
    teamRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    logo: {
      width: 30,
      height: 30,
      objectFit: "contain",
      flexShrink: 0,
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
    dangerButton: {
      border: "1px solid #EF3B24",
      background: "transparent",
      color: "#EF3B24",
      padding: "10px",
      fontWeight: 900,
      borderRadius: 0,
      cursor: "pointer",
      textTransform: "uppercase",
      width: "100%",
      fontSize: 13,
      marginTop: 8,
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
    headshot: {
      width: 92,
      height: 92,
      objectFit: "cover",
      border: `1px solid ${theme.border}`,
      background: theme.pane,
      marginBottom: 10,
    },
  };

  const clue = activeChallenge?.starting_clue_json || {};
  const season = activeChallenge?.season || {};
  const hint1 = activeChallenge?.hint_1_json || {};
  const hint2 = activeChallenge?.hint_2_json || {};
  const hint3 = activeChallenge?.hint_3_json || {};
  const ended = isSolved || gaveUp || wrongGuesses.length >= 10;

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

        {loading ? (
          <div style={styles.card}>Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <>
            <input
              style={styles.dateInput}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div style={styles.card}>No challenges found for this date.</div>
          </>
        ) : !hasStarted ? (
          <>
            <section style={styles.setupHero}>
              <div style={styles.label}>Daily Challenge</div>
              <div style={styles.setupTitle}>Guess The Player</div>
              <div style={styles.sub}>
                Pick a date, choose your difficulty, then start the clock.
              </div>
            </section>

            <input
              style={styles.dateInput}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <div style={styles.tabs}>
              {["easy", "medium", "hard"].map((difficulty) => (
                <button
                  key={difficulty}
                  style={{
                    ...styles.tab,
                    ...(selectedDifficulty === difficulty ? styles.activeTab : {}),
                  }}
                  onClick={() => chooseDifficulty(difficulty)}
                >
                  {difficulty}
                </button>
              ))}
            </div>

            <button style={styles.startButton} onClick={startGame}>
              Start
            </button>
          </>
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
                  onClick={() => {
                    setSelectedDifficulty(c.difficulty);
                    resetGameState(c, true);
                  }}
                >
                  #{c.daily_slot} · {c.difficulty}
                </button>
              ))}
            </div>

            {activeChallenge && (
              <>
                {!ended && (
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

                    <button style={styles.dangerButton} onClick={giveUp}>
                      Give Up
                    </button>

                    {message && <div style={styles.message}>{message}</div>}
                  </section>
                )}

                <section style={styles.card}>
                  <div style={styles.metaRow}>
                    <div>
                      <div style={styles.label}>Team</div>
                      <div style={styles.teamRow}>
                        {activeChallenge.team?.logo_url && (
                          <img src={activeChallenge.team.logo_url} alt="" style={styles.logo} />
                        )}
                        <div style={styles.big}>
                          {activeChallenge.team?.display_name || "Unknown Team"}
                        </div>
                      </div>
                      <div style={styles.sub}>{activeChallenge.season_range}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={styles.label}>Timer</div>
                      <div style={{ ...styles.big, ...styles.orange }}>{secondsElapsed}s</div>
                    </div>
                  </div>

                  <button
                    style={{
                      ...styles.hintButton,
                      ...(ended || hintsShown >= 3 ? styles.disabledButton : {}),
                    }}
                    onClick={revealHint}
                    disabled={ended || hintsShown >= 3}
                  >
                    {hintsShown >= 3 ? "All Hints Revealed" : `Reveal Hint #${hintsShown + 1}`}
                  </button>

                  {hintsShown >= 1 && <div style={styles.hintText}>Hint 1: {renderHint(hint1)}</div>}
                  {hintsShown >= 2 && <div style={styles.hintText}>Hint 2: {renderHint(hint2)}</div>}
                  {hintsShown >= 3 && <div style={styles.hintText}>Hint 3: {renderHint(hint3)}</div>}
                </section>

                <section style={styles.card}>
                  <div style={styles.label}>Stat line</div>

                  <div style={styles.statGrid}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>PTS</div>
                      <div style={styles.statValue}>
                        {formatStat(season.points_per_game ?? clue.points_per_game)}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>REB</div>
                      <div style={styles.statValue}>
                        {formatStat(season.rebounds_per_game ?? clue.rebounds_per_game)}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>AST</div>
                      <div style={styles.statValue}>
                        {formatStat(season.assists_per_game ?? clue.assists_per_game)}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>STL</div>
                      <div style={styles.statValue}>
                        {formatStat(season.steals_per_game ?? clue.steals_per_game)}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>BLK</div>
                      <div style={styles.statValue}>
                        {formatStat(season.blocks_per_game ?? clue.blocks_per_game)}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>GS</div>
                      <div style={styles.statValue}>
                        {formatStat(season.game_score ?? clue.game_score)}
                      </div>
                    </div>
                  </div>

                  <div style={styles.pillRow}>
                    <div style={styles.pill}>Misses {wrongGuesses.length}/10</div>
                    <div style={styles.pill}>Hints {hintsShown}</div>
                  </div>

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

                {ended && (
                  <section style={styles.card}>
                    <div style={styles.label}>Result</div>
                    {activeChallenge.player?.headshot_url && (
                      <img
                        src={activeChallenge.player.headshot_url}
                        alt={activeChallenge.player.full_name || "Player headshot"}
                        style={styles.headshot}
                      />
                    )}
                    
                    <div style={styles.big}>Answer: {activeChallenge.player?.full_name}</div>
                    <div style={styles.sub}>
                      {activeChallenge.season_label} · {activeChallenge.team?.abbreviation}
                    </div>

                    <div style={styles.statGrid}>
                      <div style={styles.statBox}>
                        <div style={styles.statLabel}>Score</div>
                        <div style={{ ...styles.statValue, ...styles.orange }}>{score ?? 0}</div>
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
