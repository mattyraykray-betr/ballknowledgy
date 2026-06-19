"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SiteNav from "../../components/SiteNav";
import ProfileModal from "../../components/ProfileModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

const HEADSHOT_FALLBACK =
  "https://i.ibb.co/1YmfgNKs/TPR-Blank-Headshot-MBB.png";

function todayLocal() {
  return new Date().toISOString().slice(0, 10);
}

function isFutureDate(dateValue) {
  return dateValue > todayLocal();
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

function formatValue(value, statKey) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";

  if (
    ["career_points", "career_assists", "career_rebounds", "career_3pm"].includes(statKey)
  ) {
    return Math.round(Number(value)).toLocaleString();
  }

  return Number(value).toFixed(1);
}

function getStatValue(row, statKey) {
  if (!row) return null;

  if (statKey === "career_3pm_avg") {
    const gp = Number(row.career_games_played || 0);
    const threes = Number(row.career_3pm || 0);
    if (gp <= 0) return null;
    return threes / gp;
  }

  return row[statKey] ?? null;
}

function calculateScore({ chainLength, secondsElapsed, misses }) {
  const chainScore = chainLength * 100;
  const speedBonus = Math.max(0, 300 - Math.floor(secondsElapsed * 2));
  const missPenalty = misses * 50;
  return Math.max(0, chainScore + speedBonus - missPenalty);
}

export default function StatLadderPage() {
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  const [hasStarted, setHasStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [ended, setEnded] = useState(false);

  const [query, setQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [chain, setChain] = useState([]);
  const [misses, setMisses] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [score, setScore] = useState(null);

  const [user, setUser] = useState(null);
  const [attemptSaved, setAttemptSaved] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [username, setUsername] = useState("");  
  const [profile, setProfile] = useState(null);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState("daily");
  const [leaderboard, setLeaderboard] = useState([]);
  const [completionStatus, setCompletionStatus] = useState(null);

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (!error) setProfile(data || null);
  }

  useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    setDarkMode(Boolean(prefersDark));
  }, []);

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

  const clue = challenge?.starting_clue_json || {};
  const statKey = clue.stat_key;
  const statLabel = clue.stat_label;
  const startingValue = Number(clue.starting_value);
  const currentThreshold =
    chain.length > 0 ? Number(chain[chain.length - 1].value) : startingValue;
  const currentTargetPlayer =
    chain.length > 0 ? chain[chain.length - 1] : null;

  function resetGame(row) {
    setChallenge(row);
    setHasStarted(false);
    setStartedAt(null);
    setSecondsElapsed(0);
    setEnded(false);
    setQuery("");
    setPlayerResults([]);
    setSelectedPlayer(null);
    setChain([]);
    setMisses([]);
    setMessage("");
    setMessageType("info");
    setScore(null);
    setAttemptSaved(false);
  }

  async function loadChallenge(dateValue) {
    setLoading(true);

    const { data, error } = await supabase
      .from("nba_trivia_challenges")
      .select(`
        id,
        challenge_date,
        daily_slot,
        challenge_type,
        difficulty,
        player_id,
        team:nba_teams(display_name, abbreviation, logo_url),
        player:nba_players(full_name, headshot_url),
        starting_clue_json,
        is_active
      `)
      .eq("challenge_type", "stat_ladder")
      .eq("challenge_date", dateValue)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error(error);
      resetGame(null);
    } else {
      resetGame(data || null);
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

  async function getCareerStats(playerId) {
    const { data, error } = await supabase
      .from("nba_player_career_stats")
      .select(`
        player_id,
        career_games_played,
        career_points,
        career_rebounds,
        career_assists,
        career_3pm,
        career_ppg,
        career_rpg,
        career_apg
      `)
      .eq("player_id", playerId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async function submitGuess() {
    if (!challenge || !selectedPlayer || ended) return;

    if (chain.some((row) => row.player_id === selectedPlayer.id)) {
      setMessageType("error");
      setMessage("Already used that player.");
      return;
    }

    if (selectedPlayer.id === challenge.player_id) {
      setMessageType("error");
      setMessage("You cannot use the starting player.");
      return;
    }

    const career = await getCareerStats(selectedPlayer.id);
    const value = getStatValue(career, statKey);

    if (value === null || value === undefined) {
      setMessageType("error");
      setMessage("No career stat found for that player.");
      return;
    }

    if (Number(value) < currentThreshold) {
      const validRow = {
        player_id: selectedPlayer.id,
        player_name: selectedPlayer.full_name,
        headshot_url: selectedPlayer.headshot_url,
        value: Number(value),
      };

      setChain((prev) => [...prev, validRow]);
      setMessageType("success");
      setMessage("Correct. Keep going.");
      setQuery("");
      setSelectedPlayer(null);
      setPlayerResults([]);
      return;
    }

    const missRow = {
      player_id: selectedPlayer.id,
      player_name: selectedPlayer.full_name,
      headshot_url: selectedPlayer.headshot_url,
      value: Number(value),
    };

    const nextMisses = [...misses, missRow];
    setMisses(nextMisses);
    setMessageType("error");
    setMessage(
      `${selectedPlayer.full_name} was too high: ${formatValue(value, statKey)}`
    );
    setQuery("");
    setSelectedPlayer(null);
    setPlayerResults([]);

    if (nextMisses.length >= 3) {
      finishGame(nextMisses, chain);
    }
  }

  async function loadLeaderboard(type = leaderboardType) {
    if (type === "daily" && challenge) {
      const { data, error } = await supabase
        .from("vw_nba_trivia_daily_challenge_leaderboard")
        .select("username, avatar_url, best_score, best_time, fewest_misses, correct, hints_used, chain_length")
        .eq("challenge_id", challenge.id)
        .order("best_score", { ascending: false })
        .limit(10);
  
      if (!error) setLeaderboard(data || []);
      return;
    }
  
    const { data, error } = await supabase
        .from("vw_nba_trivia_all_time_leaderboard")
        .select(
          "username, avatar_url, total_score, avg_score, correct_challenges"
        )
        .eq("challenge_type", "stat_ladder")
        .order("total_score", { ascending: false })
        .limit(10);
  
    if (!error) setLeaderboard(data || []);
  }  

  function formatShareDate(dateString) {
    const d = new Date(dateString + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  function ladderGolfShareText() {
    return (
      `${chain.length} chain, ${misses.length} misses, ⏱️ ${formatTimer(secondsElapsed)}\n` +
      `${"✅".repeat(chain.length)}${"🟥".repeat(misses.length)}`
    );
  }
  
  function getShareText(gameName, scoreText) {
    return (
      `${gameName} | ${formatShareDate(challenge?.challenge_date || selectedDate)}\n` +
      `${scoreText}\n\n` +
      `Try to beat my score: ${window.location.origin}/ladder-golf`
    );
  }
  
  async function shareResult(gameName, scoreText) {
    const shareText = getShareText(gameName, scoreText);
    if (navigator.share) {
      await navigator.share({
        title: "That Guy Rocked",
        text: shareText,
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("Score copied to clipboard.");
    }
  }
  
  function openTwitterShare(gameName, scoreText) {
    const shareText = getShareText(gameName, scoreText);
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
  
  async function openFacebookShare(gameName, scoreText) {
    const shareText = getShareText(gameName, scoreText);
    await navigator.clipboard.writeText(shareText);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        `${window.location.origin}/ladder-golf`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
    alert("Score copied. Paste it into your Facebook post.");
  }
  
  async function copyShareText(gameName, scoreText) {
    await navigator.clipboard.writeText(getShareText(gameName, scoreText));
    alert("Score copied to clipboard.");
  }
  
  function openEmailShare(gameName, scoreText) {
    window.location.href = `mailto:?subject=${encodeURIComponent(
      "That Guy Rocked score"
    )}&body=${encodeURIComponent(getShareText(gameName, scoreText))}`;
  }
  
  async function finishGame(finalMisses = misses, finalChain = chain) {
    const finalSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const finalScore = calculateScore({
      chainLength: finalChain.length,
      secondsElapsed: finalSeconds,
      misses: finalMisses.length,
    });

    setEnded(true);
    setSecondsElapsed(finalSeconds);
    setScore(finalScore);
    setMessageType("info");
    setMessage("Run complete.");

    await saveAttempt({
      finalScore,
      finalSeconds,
      finalMisses,
      finalChain,
    });

    setTimeout(() => {
      setLeaderboardType("daily");
      loadLeaderboard("daily");
      setShowLeaderboard(true);
    }, 700);    
  }

  async function saveAttempt({ finalScore, finalSeconds, finalMisses, finalChain }) {
    if (!user || !challenge) return;
  
    const { error } = await supabase
      .from("nba_trivia_attempts")
      .insert({
        challenge_id: challenge.id,
        user_id: user.id,
        guessed_player_id:
          finalChain.length > 0 ? finalChain[finalChain.length - 1].player_id : null,
        is_correct: finalChain.length > 0,
        seconds_elapsed: finalSeconds,
        wrong_guess_count: finalMisses.length,
        hints_used: 0,
        score: finalScore,
        gave_up: finalMisses.length < 3,
        completed: true,
        final_guess_count: finalChain.length + finalMisses.length,
        difficulty: challenge.difficulty,
        challenge_date: challenge.challenge_date,
        completed_at: new Date().toISOString(),
        chain_length: finalChain.length,
        challenge_type: "stat_ladder",
        result_json: {
          game: "stat_ladder",
          stat_key: statKey,
          stat_label: statLabel,
          starting_player_id: challenge.player_id,
          starting_player_name: challenge.player?.full_name,
          starting_value: startingValue,
          chain: finalChain,
          misses: finalMisses,
        },
      });
  
    if (!error) {
      setAttemptSaved(true);
      loadCompletionStatus();
    } else {
      console.error(error);
    }
  }

  async function loadCompletionStatus() {
    if (!user || !challenge) {
      setCompletionStatus(null);
      return;
    }
  
    const { data, error } = await supabase
      .from("nba_trivia_attempts")
      .select("id, completed, is_correct, score, seconds_elapsed, wrong_guess_count, chain_length, result_json")
      .eq("user_id", user.id)
      .eq("challenge_id", challenge.id)
      .eq("difficulty", challenge.difficulty)
      .eq("challenge_type", "stat_ladder")
      .eq("completed", true)
      .maybeSingle();
  
    if (!error) setCompletionStatus(data || null);
  }
  
  function startGame() {
    if (!challenge) return;
  
    if (completionStatus?.completed) {
      setMessageType("info");
      setMessage("You've completed this challenge already.");
      return;
    }
  
    setHasStarted(true);
    setStartedAt(Date.now());
    setSecondsElapsed(0);
    setEnded(false);
    setMessage("");
  }

  useEffect(() => {
    loadChallenge(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadCompletionStatus();
  }, [user, challenge]);
  
  useEffect(() => {
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

  useEffect(() => {
    if (!hasStarted || ended || !startedAt) return;

    const timer = setInterval(() => {
      setSecondsElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, ended, startedAt]);

  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      overflowX: "hidden",
      background: theme.bg,
      color: theme.text,
      fontFamily:
        'Arial, Helvetica, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      margin: 0,
    },
    wrap: {
      maxWidth: 520,
      margin: "0 auto",
      padding: 12,
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
    card: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
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
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 2,
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
      padding: "5px 10px",
      fontWeight: 900,
      borderRadius: 6,
      cursor: "pointer",
      textTransform: "uppercase",
      fontSize: 11,
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
    resultList: {
      border: `1px solid ${theme.border}`,
      background: theme.input,
      marginBottom: 8,
      borderRadius: 6,
      overflow: "hidden",
    },
    resultItem: {
      padding: 10,
      borderBottom: `1px solid ${theme.border}`,
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
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
    playerRow: {
      display: "flex",
      gap: 10,
      alignItems: "center",
    },
    headshot: {
      width: 72,
      height: 72,
      objectFit: "cover",
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      background: theme.pane,
      flexShrink: 0,
    },
    statHero: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 10,
    },
    statBox: {
      background: theme.input,
      borderTop: `2px solid ${theme.border}`,
      padding: "8px 6px",
      borderRadius: 6,
      textAlign: "center",
    },
    statLabel: {
      fontSize: 9,
      color: theme.muted,
      fontWeight: 900,
      textTransform: "uppercase",
    },
    statValue: {
      fontSize: 18,
      fontWeight: 950,
      marginTop: 2,
    },
    chainRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: theme.input,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: 8,
      marginTop: 8,
    },
    message: {
      fontWeight: 900,
      color: "#EF3B24",
      marginTop: 8,
      fontSize: 13,
    },
    green: {
      color: "#00C853",
    },
    orange: {
      color: "#EF3B24",
    },
    miniTeamRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: theme.muted,
      fontSize: 12,
      marginTop: 2,
    },
    miniLogo: {
      width: 18,
      height: 18,
      objectFit: "contain",
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
    tabs: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    },
    activeTab: {
      background: "transparent",
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderBottom: "3px solid #EF3B24",
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
    shareGrid: {
      display: "flex",
      gap: 10,
      marginTop: 8,
      marginBottom: 12,
      alignItems: "center",
    },
    shareIconButton: {
      border: `1px solid ${theme.border}`,
      background: theme.input,
      color: theme.text,
      width: 44,
      height: 44,
      borderRadius: "50%",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 950,
      fontSize: 18,
    },
    postGameButtonRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 8,
    },
    timerContainer: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      textAlign: "right",
    },
    completeBanner: {
      border: "1px solid #EF3B24",
      color: "#EF3B24",
      borderRadius: 6,
      padding: "10px 12px",
      fontWeight: 950,
      textTransform: "uppercase",
      fontSize: 12,
      marginBottom: 12,
      textAlign: "center",
    },    
  };

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>That Guy Rocked</h1>
            <div style={styles.sub}>
              <Link href="/" style={{ color: "inherit" }}>
                Back to Games Home
              </Link>
            </div>
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
          profile={profile}
          username={profile?.username || username}
          showLeaderboardButton={true}
          onLeaderboardClick={() => {
            setLeaderboardType("daily");
            loadLeaderboard("daily");
            setShowLeaderboard(true);
          }}
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
                    {leaderboardType === "daily" ? "Daily Ladder Golf" : "All-Time Ladder Golf"}
                  </div>
                </div>
        
                <button style={styles.closeButton} onClick={() => setShowLeaderboard(false)}>
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
                  <div key={`${row.username}-${idx}`} style={styles.chainRow}>
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" style={styles.leaderboardAvatar} />
                    ) : (
                      <div style={styles.leaderboardAvatarFallback}>
                        {(row.username || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
        
                    <div style={{ flex: 1 }}>
                      <strong>
                        {idx + 1}. {row.username || "Guest"}
                      </strong>
        
                      <div style={styles.sub}>
                        {leaderboardType === "daily"
                          ? `${row.best_score || 0} pts · ${formatTimer(row.best_time || 0)} · ${row.chain_length || 0} chain`
                          : `${row.total_score || 0} pts · Avg ${Math.round(row.avg_score || 0)} · Correct ${row.correct_challenges || 0}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
        
              {ended && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ ...styles.label, marginTop: 14 }}>Share</div>
        
                  <div style={styles.shareGrid}>
                    <button style={styles.shareIconButton} onClick={() => openTwitterShare("Ladder Golf", ladderGolfShareText())}>𝕏</button>
                    <button style={styles.shareIconButton} onClick={() => openFacebookShare("Ladder Golf", ladderGolfShareText())}>f</button>
                    <button style={styles.shareIconButton} onClick={() => copyShareText("Ladder Golf", ladderGolfShareText())}>
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                    <button style={styles.shareIconButton} onClick={() => shareResult("Ladder Golf", ladderGolfShareText())}>
                      <span className="material-symbols-outlined">chat_bubble</span>
                    </button>
                    <button style={styles.shareIconButton} onClick={() => openEmailShare("Ladder Golf", ladderGolfShareText())}>
                      <span className="material-symbols-outlined">drafts</span>
                    </button>
                  </div>
        
                  <div style={styles.postGameButtonRow}>
                    <button
                      style={styles.primaryButton}
                      onClick={() => {
                        setShowLeaderboard(false);
                        resetGame(challenge);
                      }}
                    >
                      Play Again
                    </button>
        
                    <button
                      style={styles.primaryButton}
                      onClick={() => {
                        setShowLeaderboard(false);
                        setShowProfile(true);
                      }}
                    >
                      {user ? "Profile" : "Create Profile/Login"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
            
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <input
            style={{ ...styles.dateInput, marginBottom: 0 }}
            type="date"
            value={selectedDate}
            max={todayLocal()}
            onChange={(e) => {
              const nextDate = e.target.value;
              if (isFutureDate(nextDate)) return;
              setSelectedDate(nextDate);
            }}
          />
        
          {hasStarted && (
            <div style={styles.timerContainer}>
              <div>
                <div style={styles.label}>Timer</div>
                <div style={{ ...styles.big, marginBottom: 0 }}>{formatTimer(secondsElapsed)}</div>
              </div>
              {!ended && (
                <button style={styles.dangerButton} onClick={() => finishGame()}>
                  Give Up
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <section style={styles.card}>Loading challenge...</section>
        ) : !challenge ? (
          <section style={styles.card}>No Stat Ladder Golf challenge found for this date.</section>
        ) : completionStatus?.completed ? (
          <>
            <section style={styles.card}>
              <div style={styles.label}>Challenge Complete</div>
              <div style={styles.completeBanner}>You've completed this challenge already.</div>
        
              <div style={styles.playerRow}>
                <img
                  src={challenge.player?.headshot_url || HEADSHOT_FALLBACK}
                  alt={challenge.player?.full_name || "Player headshot"}
                  style={styles.headshot}
                />
        
                <div>
                  <div style={styles.big}>Answer: {challenge.player?.full_name}</div>
                  <div style={styles.sub}>
                    Starting value: {formatValue(completionStatus.result_json?.starting_value ?? startingValue, statKey)} {statLabel}
                  </div>
                  <div style={{ ...styles.sub, marginTop: 8 }}>
                    Score {completionStatus.score ?? 0} · Chain {completionStatus.chain_length ?? 0} · Misses {completionStatus.wrong_guess_count ?? 0} · Time {formatTimer(completionStatus.seconds_elapsed ?? 0)}
                  </div>
                </div>
              </div>
            </section>
        
            {completionStatus.result_json?.chain?.length > 0 && (
              <section style={styles.card}>
                <div style={styles.label}>Your Chain</div>
        
                {completionStatus.result_json.chain.map((row, idx) => (
                  <div key={`${row.player_id}-${idx}`} style={styles.chainRow}>
                    <img
                      src={row.headshot_url || HEADSHOT_FALLBACK}
                      alt=""
                      style={styles.searchHeadshot}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{idx + 1}. {row.player_name}</strong>
                      <div style={styles.sub}>
                        {formatValue(row.value, completionStatus.result_json?.stat_key || statKey)} {completionStatus.result_json?.stat_label || statLabel}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        ) : !hasStarted ? (
          <>
            <section style={styles.card}>
              <div style={styles.label}>Daily Challenge</div>
              <div style={styles.big}>Stat Ladder Golf</div>
              <div style={styles.sub}>
                Name players with a lower career value than the previous player.
              </div>

              <div style={styles.statHero}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Stat</div>
                  <div style={styles.statValue}>{statLabel}</div>
                </div>

                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Misses Allowed</div>
                  <div style={styles.statValue}>3</div>
                </div>
              </div>
            </section>

            <button style={styles.startButton} onClick={startGame}>
              Start
            </button>
          </>
        ) : (
          <>
            <section style={styles.card}>
              <div style={styles.label}>Starting Player</div>
            
              <div style={styles.playerRow}>
                <img src={challenge.player.headshot_url || HEADSHOT_FALLBACK} alt="" style={styles.headshot} />
            
                <div>
                  <div style={styles.big}>{challenge.player?.full_name}</div>
            
                  <div style={styles.miniTeamRow}>
                    {challenge.team?.logo_url && (
                      <img src={challenge.team.logo_url} alt="" style={styles.miniLogo} />
                    )}
                    <span>{challenge.team?.display_name || "Primary team unavailable"}</span>
                  </div>
            
                  <div style={styles.sub}>
                    {statLabel}: {formatValue(startingValue, statKey)}
                  </div>
                </div>
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.label}>Current Target</div>
            
              <div style={styles.statHero}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Beat This Number</div>
                  <div style={styles.statValue}>
                    {formatValue(currentThreshold, statKey)}
                  </div>
                </div>
            
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Set By</div>
                  <div style={styles.statValue}>
                    {currentTargetPlayer
                      ? currentTargetPlayer.player_name
                      : challenge.player?.full_name}
                  </div>
                </div>
              </div>
            
              <div style={styles.sub}>
                Next valid answer must be lower than{" "}
                {formatValue(currentThreshold, statKey)} {statLabel}.
              </div>
            </section>

            {!ended && (
              <section style={styles.card}>
                <div style={styles.label}>Name a lower player</div>

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

                {message && (
                  <div
                    style={{
                      ...styles.message,
                      color: messageType === "success" ? "#00C853" : "#EF3B24",
                    }}
                  >
                    {message}
                  </div>
                )}
              </section>
            )}

            <section style={styles.card}>
              <div style={styles.label}>Run</div>

              <div style={styles.statHero}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Chain</div>
                  <div style={styles.statValue}>{chain.length}</div>
                </div>

                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Misses</div>
                  <div style={styles.statValue}>{misses.length}/3</div>
                </div>
              </div>

              {chain.map((row, idx) => (
                <div key={`${row.player_id}-${idx}`} style={styles.chainRow}>
                  <img src={row.headshot_url || HEADSHOT_FALLBACK} alt="" style={styles.searchHeadshot} />
                  <div style={{ flex: 1 }}>
                    <strong>✓ {row.player_name}</strong>
                    <div style={styles.sub}>
                      {formatValue(row.value, statKey)} {statLabel}
                    </div>
                  </div>
                </div>
              ))}

              {misses.map((row, idx) => (
                <div key={`${row.player_id}-${idx}`} style={styles.chainRow}>
                  <img src={row.headshot_url || HEADSHOT_FALLBACK} alt="" style={styles.searchHeadshot} />
                  <div style={{ flex: 1 }}>
                    <strong style={styles.orange}>✕ {row.player_name}</strong>
                    <div style={styles.sub}>
                      {formatValue(row.value, statKey)} was not lower
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {ended && (
              <section style={styles.card}>
                <div style={styles.label}>Result</div>
                <div style={styles.big}>Score: {score ?? 0}</div>
                <div style={styles.sub}>
                  Chain {chain.length} · Misses {misses.length} · Time {formatTimer(secondsElapsed)}
                </div>

                <div style={{ ...styles.sub, marginTop: 8 }}>
                  {user
                    ? attemptSaved
                      ? "Score saved."
                      : "Saving score..."
                    : "Create a guest profile on to save scores."}
                </div>
                <div style={styles.postGameButtonRow}>
                  <button style={styles.primaryButton} onClick={() => resetGame(challenge)}>
                    Play Again
                  </button>
                
                  <button
                    style={styles.primaryButton}
                    onClick={() => {
                      setLeaderboardType("daily");
                      loadLeaderboard("daily");
                      setShowLeaderboard(true);
                    }}
                  >
                    Leaderboard
                  </button>
                </div>
                
                <div style={{ ...styles.label, marginTop: 14 }}>Share</div>
                
                <div style={styles.shareGrid}>
                  <button style={styles.shareIconButton} onClick={() => openTwitterShare("Ladder Golf", ladderGolfShareText())}>𝕏</button>
                  <button style={styles.shareIconButton} onClick={() => openFacebookShare("Ladder Golf", ladderGolfShareText())}>f</button>
                  <button style={styles.shareIconButton} onClick={() => copyShareText("Ladder Golf", ladderGolfShareText())}>
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                  <button style={styles.shareIconButton} onClick={() => shareResult("Ladder Golf", ladderGolfShareText())}>
                    <span className="material-symbols-outlined">chat_bubble</span>
                  </button>
                  <button style={styles.shareIconButton} onClick={() => openEmailShare("Ladder Golf", ladderGolfShareText())}>
                    <span className="material-symbols-outlined">drafts</span>
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
