"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteNav from "../../components/SiteNav";
import ProfileModal from "../../components/ProfileModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const HEADSHOT_FALLBACK =
  "https://i.ibb.co/1YmfgNKs/TPR-Blank-Headshot-MBB.png";

function todayLocal() {
  return new Date().toISOString().slice(0, 10);
}

function formatTimer(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function difficultyLabel(difficulty) {
  if (difficulty === "easy") return "Gimme";
  if (difficulty === "medium") return "Ball Knowledge";
  if (difficulty === "hard") return "ELITE Ball Knowledge";
  return difficulty;
}

function getCompletionForDifficulty(completionStatus, difficulty) {
  return completionStatus.find((row) => row.difficulty === difficulty);
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

function getScoreColor(score) {
  if (score >= 850) return "#00C853";
  if (score >= 700) return "#64DD17";
  if (score >= 500) return "#FFD600";
  if (score >= 300) return "#FF9100";
  return "#EF3B24";
}

function getResultColor({ isSolved, gaveUp, wrongGuesses }) {
  if (isSolved) return "#00C853";
  if (gaveUp || wrongGuesses.length >= 10) return "#EF3B24";
  return null;
}

function cleanLabel(value) {
  if (!value) return "";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderHint(hint) {
  if (!hint || Object.keys(hint).length === 0) return null;

  const rows = [];

  if (hint.height) rows.push({ label: "Height", value: hint.height });
  if (hint.weight) rows.push({ label: "Weight", value: hint.weight });
  if (hint.depth_chart_position) {
    rows.push({ label: "Depth Chart Position", value: hint.depth_chart_position });
  }

  if (hint.draft_info) rows.push({ label: "Draft Info", value: hint.draft_info });
  if (hint.college_or_previous_team) {
    rows.push({ label: "Drafted From", value: hint.college_or_previous_team });
  }
  if (hint.hometown) rows.push({ label: "Hometown", value: hint.hometown });

  if (hint.label && hint.value) {
    rows.push({ label: cleanLabel(hint.label), value: hint.value });
  }

  if (hint.type && hint.value) {
    rows.push({ label: cleanLabel(hint.type), value: hint.value });
  }

  if (hint.text) rows.push({ label: "Hint", value: hint.text });

  return rows;
}

function renderHint3(hint, styles) {
  const teammates = hint?.teammates || [];

  return (
    <div>
      <div>Exact year: {hint?.exact_year || "-"}</div>

      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        {teammates.map((t) => (
          <div key={t.full_name} style={styles.teammateRow}>
              <img
                src={t.headshot_url || HEADSHOT_FALLBACK}
                alt={t.full_name}
                style={styles.teammateHeadshot}
              />

            <div>
              <strong>{t.full_name}</strong>
              <div style={styles.teammateStats}>
                {formatStat(t.points_per_game)} PPG ·{" "}
                {formatStat(t.rebounds_per_game)} RPG ·{" "}
                {formatStat(t.assists_per_game)} APG
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    setDarkMode(Boolean(prefersDark));
  }, []);

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
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardType, setLeaderboardType] = useState("daily");
  const [completionStatus, setCompletionStatus] = useState([]);
  const [userStreaks, setUserStreaks] = useState(null);
  
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
  
  async function loadUserStreaks() {
    if (!user) {
      setUserStreaks(null);
      return;
    }
  
    const { data, error } = await supabase
      .from("vw_nba_trivia_user_streaks")
      .select("current_streak, best_streak")
      .eq("user_id", user.id)
      .maybeSingle();
  
    if (!error) {
      setUserStreaks(data || { current_streak: 0, best_streak: 0 });
    }
  }
  
  async function saveAttempt({ correct, gaveUpNow, outOfGuesses, finalSeconds, finalScore }) {
    if (!user || !activeChallenge) return;
  
    const { error } = await supabase
      .from("nba_trivia_attempts")
      .upsert(
        {
          challenge_id: activeChallenge.id,
          user_id: user.id,
          guessed_player_id: correct ? activeChallenge.player_id : null,
          is_correct: correct,
          seconds_elapsed: finalSeconds,
          wrong_guess_count: wrongGuesses.length,
          hints_used: hintsShown,
          score: finalScore,
          gave_up: gaveUpNow || outOfGuesses,
          completed: true,
          final_guess_count: wrongGuesses.length + (correct ? 1 : 0),
          difficulty: activeChallenge.difficulty,
          challenge_date: activeChallenge.challenge_date,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "challenge_id,user_id",
        }
      );
  
    if (!error) {
      setAttemptSaved(true);
      loadLeaderboard();
      loadCompletionStatus();
      loadUserStreaks();
    }
    else console.error(error);
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
      .select("id, full_name, headshot_url")
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

  async function loadLeaderboard(type = leaderboardType) {
    if (type === "daily" && activeChallenge) {
      const { data, error } = await supabase
        .from("vw_nba_trivia_daily_challenge_leaderboard")
        .select("username, avatar_url, best_score, best_time, fewest_misses, correct")
        .eq("challenge_id", activeChallenge.id)
        .order("best_score", { ascending: false })
        .limit(10);
  
      if (!error) setLeaderboard(data || []);
      return;
    }
  
    const { data, error } = await supabase
      .from("vw_nba_trivia_all_time_leaderboard")
      .select("username, avatar_url, total_score, avg_score, correct_challenges")
      .order("total_score", { ascending: false })
      .limit(10);
  
    if (!error) setLeaderboard(data || []);
  }

  async function loadCompletionStatus() {
    if (!user) {
      setCompletionStatus([]);
      return;
    }
  
    const { data, error } = await supabase
      .from("vw_nba_trivia_daily_completion_status")
      .select("challenge_id, difficulty, completed, is_correct, score")
      .eq("user_id", user.id)
      .eq("challenge_date", selectedDate);
  
    if (!error) setCompletionStatus(data || []);
  }
  
  function chooseDifficulty(difficulty) {
    setSelectedDifficulty(difficulty);
    const challenge = challenges.find((c) => c.difficulty === difficulty);
    resetGameState(challenge || null, false);
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

    setAttemptSaved(false);
    saveAttempt({
      correct,
      gaveUpNow,
      outOfGuesses,
      finalSeconds,
      finalScore,
    });    
    
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

  useEffect(() => {
    loadCompletionStatus();
  }, [user, selectedDate]);
  
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
  
    loadUser();
  
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);
  
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
      fontFamily: "'Roboto Slab', Rockwell, serif",
      fontSize: 24,
      fontWeight: 800,
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
      borderRadius: 6,
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
      borderRadius: 6,
      fontSize: 12,
      marginBottom: 10,
    },
    setupHero: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
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
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: 6,
      marginBottom: 10,
    },
    tab: {
      padding: "8px 5px",
      border: `1px solid ${theme.border}`,
      background: theme.card,
      color: theme.text,
      borderRadius: 6,
      fontWeight: 900,
      cursor: "pointer",
      textAlign: "center",
      textTransform: "uppercase",
      fontSize: 10,
      lineHeight: 1.15,
    },
    activeTab: {
      background: "transparent",
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderBottom: "3px solid #EF3B24",
    },
    startButton: {
      border: "1px solid #EF3B24",
      background: "#EF3B24",
      color: "#ffffff",
      padding: "15px",
      fontWeight: 950,
      borderRadius: 6,
      cursor: "pointer",
      textTransform: "uppercase",
      width: "100%",
      fontSize: 18,
      letterSpacing: "-0.03em",
    },
    card: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
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
      width: 42,
      height: 42,
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
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: 2,
      marginTop: 10,
    },
    statBox: {
      background: theme.input,
      borderTop: `2px solid ${theme.border}`,
      padding: "6px 2px",
      textAlign: "center",
    },
    statLabel: {
      fontSize: 9,
      color: theme.muted,
      fontWeight: 900,
    },
    statValue: {
      fontSize: 12,
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
      borderRadius: 6,
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
      borderRadius: 6,
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
      borderRadius: 6,
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
      borderRadius: 6,
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
    teammateRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: theme.input,
      border: `1px solid ${theme.border}`,
      padding: 7,
    },    
    teammateHeadshot: {
      width: 34,
      height: 34,
      objectFit: "cover",
      background: theme.pane,
      border: `1px solid ${theme.border}`,
      borderRadius: "50%",
      flexShrink: 0,
    },   
    teammateStats: {
      fontSize: 11,
      color: theme.muted,
      fontWeight: 800,
      marginTop: 2,
    },
    hintRow: {
      display: "grid",
      gap: 2,
      marginTop: 9,
    },
    
    hintLabelSmall: {
      fontSize: 9,
      color: theme.muted,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    
    hintValueBig: {
      fontSize: 14,
      color: theme.text,
      fontWeight: 850,
      lineHeight: 1.25,
    },
    guessRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      border: `1px solid ${theme.border}`,
      background: theme.pane,
      padding: "5px 7px",
      fontSize: 10,
      fontWeight: 900,
      textTransform: "uppercase",
      borderRadius: 6,
    },
    
    wrongX: {
      color: "#EF3B24",
      fontWeight: 950,
    },
    
    correctCheck: {
      color: "#00C853",
      fontWeight: 950,
      marginRight: 6,
    },
    
    searchSubmitRow: {
      display: "grid",
      gridTemplateColumns: "4fr 1fr",
      gap: 8,
      alignItems: "start",
    },
    
    smallSubmitButton: {
      border: `1px solid ${selectedPlayer ? "#003594" : theme.border}`,
      background: selectedPlayer ? "#003594" : theme.pane,
      color: selectedPlayer ? "#ffffff" : theme.muted,
      padding: "11px 8px",
      fontWeight: 900,
      borderRadius: 6,
      cursor: selectedPlayer ? "pointer" : "not-allowed",
      textTransform: "uppercase",
      width: "100%",
      fontSize: 12,
    },
    topStatusRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 8,
    },
    
    statusMini: {
      flex: 1,
      background: theme.pane,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: "6px 8px",
      textAlign: "center",
    },
    
    resultRow: {
      display: "flex",
      gap: 12,
      alignItems: "center",
    },
    
    resultHeadshot: {
      width: 82,
      height: 82,
      objectFit: "cover",
      border: `1px solid ${theme.border}`,
      background: theme.pane,
      borderRadius: 8,
      flexShrink: 0,
    },
    
    completeBanner: {
      border: `1px solid ${isSolved ? "#00C853" : "#EF3B24"}`,
      color: isSolved ? "#00C853" : "#EF3B24",
      background: "transparent",
      borderRadius: 6,
      padding: "8px 10px",
      fontSize: 12,
      fontWeight: 950,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    
    searchResultRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    
    searchHeadshot: {
      width: 28,
      height: 28,
      objectFit: "cover",
      borderRadius: 5,
      background: theme.pane,
      border: `1px solid ${theme.border}`,
    },
    
    teammateHeader: {
      color: "#EF3B24",
      fontSize: 11,
      fontWeight: 950,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      marginBottom: 6,
    },
    modalBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.72)",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
    },
    
    modalCard: {
      width: "100%",
      maxWidth: 520,
      maxHeight: "82vh",
      overflowY: "auto",
      background: theme.card,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      padding: 14,
    },
    
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    
    closeButton: {
      border: `1px solid ${theme.border}`,
      background: theme.pane,
      color: theme.text,
      borderRadius: 6,
      cursor: "pointer",
      width: 34,
      height: 34,
      fontWeight: 950,
    },
    leaderboardAvatar: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      objectFit: "cover",
      border: `1px solid ${theme.border}`,
      flexShrink: 0,
    },
    leaderboardAvatarFallback: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: darkMode ? "#003594" : "#E8F0FF",
      color: darkMode ? "#ffffff" : "#003594",
      border: `1px solid ${theme.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 900,
      fontSize: 16,
      flexShrink: 0,
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
            <h1 style={styles.title}>That Guy Rocked</h1>
            <div style={styles.sub}>NBA player challenge</div>
          </div>

          <button style={styles.iconButton} onClick={() => setShowMenu(true)}>
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
          username={username}
        />
        
        <ProfileModal
          show={showProfile}
          onClose={() => setShowProfile(false)}
          user={user}
          setUser={setUser}
          darkMode={darkMode}
          theme={theme}
        />
  
        {showLeaderboard && (
          <div style={styles.modalBackdrop}>
            <section style={styles.modalCard}>
              <div style={styles.modalHeader}>
                <div>
                  <div style={styles.label}>Leaderboard</div>
                  <div style={styles.big}>
                    {leaderboardType === "daily" ? "Daily Challenge" : "All-Time"}
                  </div>
                </div>
        
                <button
                  style={styles.closeButton}
                  onClick={() => setShowLeaderboard(false)}
                >
                  ×
                </button>
              </div>

              <div style={styles.tabs}>
                <button
                  style={{
                    ...styles.tab,
                    ...(leaderboardType === "daily" ? styles.activeTab : {}),
                  }}
                  onClick={() => {
                    setLeaderboardType("daily");
                    loadLeaderboard("daily");
                  }}
                >
                  Daily
                </button>
              
                <button
                  style={{
                    ...styles.tab,
                    ...(leaderboardType === "alltime" ? styles.activeTab : {}),
                  }}
                  onClick={() => {
                    setLeaderboardType("alltime");
                    loadLeaderboard("alltime");
                  }}
                >
                  All Time
                </button>
              </div>

              {leaderboard.length === 0 ? (
                <div style={styles.sub}>No leaderboard results yet.</div>
              ) : (
                leaderboard.map((row, idx) => (
                  <div key={`${row.username}-${idx}`} style={styles.teammateRow}>
                    {row.avatar_url ? (
                      <img
                        src={row.avatar_url}
                        alt=""
                        style={styles.leaderboardAvatar}
                      />
                    ) : (
                      <div style={styles.leaderboardAvatarFallback}>
                        {(row.username || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
        
                    <div style={{ flex: 1 }}>
                      <strong>
                        {idx + 1}. {row.username || "Guest"}
                      </strong>
        
                      <div style={styles.teammateStats}>
                        {leaderboardType === "daily"
                          ? `${row.best_score || 0} pts · ${formatStat(row.best_time)}s · Misses ${row.fewest_misses || 0}`
                          : `${row.total_score || 0} pts · Avg ${formatStat(row.avg_score)} · Correct ${row.correct_challenges || 0}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

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
              <div style={styles.setupTitle}>Ball Knowledgy</div>
              <div style={styles.sub}>
                Choose your difficulty, start the clock, and try to guess the player.
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
                  key=
                    {(() => {
                      const status = getCompletionForDifficulty(completionStatus, difficulty);
                      return `${status?.completed ? (status.is_correct ? "✓ " : "✕ ") : ""}${difficultyLabel(difficulty)}`;
                    })()}                
                  style={{
                    ...styles.tab,
                    ...(selectedDifficulty === difficulty ? styles.activeTab : {}),
                  }}
                  onClick={() => chooseDifficulty(difficulty)}
                >
                  {(() => {
                    const status = getCompletionForDifficulty(completionStatus, difficulty);
                    return `${status?.completed ? (status.is_correct ? "✓ " : "✕ ") : ""}${difficultyLabel(difficulty)}`;
                  })()}
                </button>
              ))}
            </div>

            <button style={styles.startButton} onClick={startGame}>
              Start
            </button>
          </>
        ) : (
          <>
            
            {ended && (
              <section style={styles.card}>
                <div style={styles.completeBanner}>
                  {isSolved ? "✓ Challenge Complete" : " Challenge Failed"}
                </div>
            
                <div style={styles.resultRow}>
                    <img
                      src={activeChallenge.player.headshot_url || HEADSHOT_FALLBACK}
                      alt={activeChallenge.player.full_name || "Player headshot"}
                      style={styles.resultHeadshot}
                    />
            
                  <div>
                    <div
                      style={{
                        ...styles.big,
                        color: getResultColor({ isSolved, gaveUp, wrongGuesses }) || theme.text,
                      }}
                    >
                      {isSolved ? (
                        <span style={styles.correctCheck}>✓</span>
                      ) : (
                        <span style={styles.wrongX}>✕ </span>
                      )}
                      Answer: {activeChallenge.player?.full_name}
                    </div>
            
                    <div style={styles.sub}>
                      {activeChallenge.season_label} · {activeChallenge.team?.abbreviation}
                    </div>
            
                    <div style={styles.topStatusRow}>
                      <div style={styles.statusMini}>
                        <div style={styles.statLabel}>Score</div>
                        <div style={{ ...styles.statValue, color: getScoreColor(score ?? 0) }}>
                          {score ?? 0}
                        </div>
                      </div>
            
                      <div style={styles.statusMini}>
                        <div style={styles.statLabel}>Time</div>
                        <div style={styles.statValue}>{formatTimer(secondsElapsed)}</div>
                      </div>
            
                      <div style={styles.statusMini}>
                        <div style={styles.statLabel}>Miss</div>
                        <div style={styles.statValue}>{wrongGuesses.length}</div>
                      </div>
                      <div style={{ ...styles.sub, marginTop: 8 }}>
                        {user
                          ? attemptSaved
                            ? "Score saved."
                            : "Saving score..."
                          : "Create a login to save your score."}
                      </div>                          
                    </div>
                  </div>
                </div>
            
                {wrongGuesses.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={styles.label}>Wrong guesses</div>
                    <div style={styles.pillRow}>
                      {wrongGuesses.map((g, idx) => (
                        <div key={`${g.id}-${idx}`} style={styles.guessRow}>
                          <span style={styles.wrongX}>✕</span>
                          {g.full_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {!ended && (
              <section style={styles.card}>
                <div style={styles.label}>Guess the player</div>
            
                <div style={styles.searchSubmitRow}>
                  <input
                    style={styles.input}
                    value={query}
                    onChange={(e) => searchPlayers(e.target.value)}
                    placeholder="Search player..."
                  />
            
                  <button
                    style={styles.smallSubmitButton}
                    disabled={!selectedPlayer}
                    onClick={submitGuess}
                  >
                    Submit
                  </button>
                </div>
            
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
                        <div style={styles.searchResultRow}>
                            <img src={p.headshot_url || HEADSHOT_FALLBACK} alt="" style={styles.searchHeadshot} />
                          <span>{p.full_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            
                {message && <div style={styles.message}>{message}</div>}
                {wrongGuesses.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={styles.label}>Wrong guesses</div>
                    <div style={styles.pillRow}>
                      {wrongGuesses.map((g, idx) => (
                        <div key={`${g.id}-${idx}`} style={styles.guessRow}>
                          <span style={styles.wrongX}>✕</span>
                          {g.full_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}                  
              </section>
            )}

            {activeChallenge && (
              <>
                <section style={styles.card}>
                  <div style={styles.label}>Stat line in selected year</div>

                  <div style={styles.statGrid}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>GP</div>
                      <div style={styles.statValue}>
                        {parseInt(season.games_played ?? clue.games_played, 10)}
                      </div>
                    </div> 
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>GS</div>
                      <div style={styles.statValue}>
                        {parseInt(season.games_started ?? clue.games_started, 10)}
                      </div>
                    </div>                        
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
                  </div>
                </section>              
                <section style={styles.card}>
                  <div style={styles.metaRow}>
                    <div>
                      <div style={styles.label}>Team</div>
                      <div style={styles.teamRow}>
                        {activeChallenge.team?.logo_url && (
                          <img src={activeChallenge.team.logo_url} alt="" style={styles.logo} />
                        )}
                        <div style={styles.big}>
                          {(activeChallenge.starting_clue_json?.team_names || [])
                            .filter(Boolean)
                            .join(" / ") ||
                            activeChallenge.team?.display_name ||
                            "Unknown Team"}
                        </div>
                      </div>
                      <div style={styles.sub}>Era: {activeChallenge.season_range}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={styles.label}>Timer</div>
                      <div style={styles.big}>{formatTimer(secondsElapsed)}</div>
                    </div>
                  </div>

                  <div style={styles.topStatusRow}>
                    <div style={styles.statusMini}>
                      <div style={styles.statLabel}>Misses</div>
                      <div style={styles.statValue}>{wrongGuesses.length}/10</div>
                    </div>
                  
                    <div style={styles.statusMini}>
                      <div style={styles.statLabel}>Hints</div>
                      <div style={styles.statValue}>{hintsShown}/3</div>
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

                  {!ended && (
                    <button style={styles.dangerButton} onClick={giveUp}>
                      Give Up
                    </button>
                  )}

                  {hintsShown >= 1 && (
                    <div style={styles.hintText}>
                      <div style={styles.label}>Hint 1</div>
                      {(renderHint(hint1) || []).map((row) => (
                        <div key={row.label} style={styles.hintRow}>
                          <div style={styles.hintLabelSmall}>{row.label}</div>
                          <div style={styles.hintValueBig}>{row.value || "-"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {hintsShown >= 2 && (
                    <div style={styles.hintText}>
                      <div style={styles.label}>Hint 2</div>
                      {(renderHint(hint2) || []).map((row) => (
                        <div key={row.label} style={styles.hintRow}>
                          <div style={styles.hintLabelSmall}>{row.label}</div>
                          <div style={styles.hintValueBig}>{row.value || "-"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {hintsShown >= 3 && (
                    <div style={styles.hintText}>
                      <div style={styles.teammateHeader}>Teammates</div>
                      {renderHint3(hint3, styles)}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
