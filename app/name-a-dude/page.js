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

function formatTimer(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function calculateScore({ correctCount, secondsElapsed, misses }) {
  const correctScore = correctCount * 100;
  const speedBonus = Math.max(0, 500 - Math.floor(secondsElapsed * 2));
  const missPenalty = misses * 75;
  return Math.max(0, correctScore + speedBonus - missPenalty);
}

export default function NameADudePage() {
  const [pool, setPool] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [usedTeamKeys, setUsedTeamKeys] = useState([]);

  const [hasStarted, setHasStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [correctPlayers, setCorrectPlayers] = useState([]);
  const [misses, setMisses] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [score, setScore] = useState(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");

  const [darkMode, setDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [dailyChallengeId, setDailyChallengeId] = useState(null);
  const [attemptSaved, setAttemptSaved] = useState(false);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState("daily");
  const [leaderboard, setLeaderboard] = useState([]);

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

  async function loadDailyChallenge() {
    const { data, error } = await supabase
      .from("nba_trivia_challenges")
      .select("id")
      .eq("challenge_type", "name_a_dude")
      .eq("challenge_date", todayLocal())
      .eq("is_active", true)
      .maybeSingle();
  
    if (!error && data) {
      setDailyChallengeId(data.id);
    }
  }

  async function saveAttempt({ finalScore, finalSeconds, finalMisses, finalCorrect }) {
    if (!user || !dailyChallengeId) return;
  
    const { error } = await supabase
      .from("nba_trivia_attempts")
      .upsert(
        {
          challenge_id: dailyChallengeId,
          user_id: user.id,
          guessed_player_id:
            finalCorrect.length > 0
              ? finalCorrect[finalCorrect.length - 1].player_id
              : null,
          is_correct: finalCorrect.length > 0,
          seconds_elapsed: finalSeconds,
          wrong_guess_count: finalMisses.length,
          hints_used: 0,
          score: finalScore,
          gave_up: finalMisses.length < 3,
          completed: true,
          final_guess_count: finalCorrect.length + finalMisses.length,
          difficulty: "open",
          challenge_date: todayLocal(),
          completed_at: new Date().toISOString(),
          chain_length: finalCorrect.length,
          result_json: {
            game: "name_a_dude",
            sport: "basketball",
            league: "nba",
            correct_players: finalCorrect,
            misses: finalMisses,
          },
        },
        {
          onConflict: "challenge_id,user_id",
        }
      );
  
    if (!error) setAttemptSaved(true);
    else console.error(error);
  }

  async function loadLeaderboard(type = leaderboardType) {
    if (type === "daily" && dailyChallengeId) {
      const { data, error } = await supabase
        .from("vw_nba_trivia_daily_challenge_leaderboard")
        .select("username, avatar_url, best_score, best_time, fewest_misses, correct")
        .eq("challenge_id", dailyChallengeId)
        .order("best_score", { ascending: false })
        .limit(10);
  
      if (!error) setLeaderboard(data || []);
      return;
    }
  
    const { data, error } = await supabase
      .from("vw_nba_trivia_all_time_leaderboard")
      .select("username, avatar_url, total_score, avg_score, correct_challenges")
      .eq("challenge_type", "name_a_dude")
      .order("total_score", { ascending: false })
      .limit(10);
  
    if (!error) setLeaderboard(data || []);
  }
  
  async function loadPool() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vw_name_a_dude_pool")
      .select("*")
      .eq("sport", "basketball")
      .eq("league", "nba");

    if (error) {
      console.error(error);
      setPool([]);
    } else {
      setPool(data || []);
    }

    setLoading(false);
  }

  function pickRandomChallenge(currentPool = pool, usedKeys = usedTeamKeys) {
    if (!currentPool.length) return null;

    let available = currentPool.filter((row) => !usedKeys.includes(row.team_key));

    if (!available.length) {
      available = currentPool;
      setUsedTeamKeys([]);
    }

    const randomRow = available[Math.floor(Math.random() * available.length)];
    setChallenge(randomRow);
    setUsedTeamKeys((prev) => [...prev, randomRow.team_key]);

    return randomRow;
  }

  function resetRun() {
    setHasStarted(false);
    setStartedAt(null);
    setSecondsElapsed(0);
    setEnded(false);
    setQuery("");
    setPlayerResults([]);
    setSelectedPlayer(null);
    setCorrectPlayers([]);
    setMisses([]);
    setMessage("");
    setMessageType("info");
    setScore(null);
    setUsedTeamKeys([]);
    setChallenge(null);
  }

  function startGame() {
    resetRun();
    setHasStarted(true);
    setStartedAt(Date.now());
    pickRandomChallenge(pool, []);
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

  function getValidPlayerMatch(playerId) {
    const validPlayers = challenge?.valid_players || [];
    return validPlayers.find((p) => Number(p.player_id) === Number(playerId));
  }

  function alreadyNamed(playerId) {
    return correctPlayers.some((p) => Number(p.player_id) === Number(playerId));
  }

  function submitGuess() {
    if (!challenge || !selectedPlayer || ended) return;

    if (alreadyNamed(selectedPlayer.id)) {
      setMessageType("error");
      setMessage("Already named that dude.");
      return;
    }

    const match = getValidPlayerMatch(selectedPlayer.id);

    if (match) {
      const correctRow = {
        player_id: selectedPlayer.id,
        full_name: selectedPlayer.full_name,
        headshot_url: selectedPlayer.headshot_url || match.headshot_url,
        team_key: challenge.team_key,
        team_name: challenge.team_name,
        season_year: challenge.season_year,
        season_label: challenge.season_label,
        jersey: match.jersey,
        position: match.position,
        games_played: match.games_played,
        games_started: match.games_started,
        points_per_game: match.points_per_game,
        rebounds_per_game: match.rebounds_per_game,
        assists_per_game: match.assists_per_game,
      };

      setCorrectPlayers((prev) => [...prev, correctRow]);
      setMessageType("success");
      setMessage("Correct. New team.");
      setQuery("");
      setSelectedPlayer(null);
      setPlayerResults([]);
      pickRandomChallenge();
      return;
    }

    const missRow = {
      player_id: selectedPlayer.id,
      full_name: selectedPlayer.full_name,
      headshot_url: selectedPlayer.headshot_url,
      team_key: challenge.team_key,
      team_name: challenge.team_name,
      season_year: challenge.season_year,
      season_label: challenge.season_label,
    };

    const nextMisses = [...misses, missRow];
    setMisses(nextMisses);
    setMessageType("error");
    setMessage(`${selectedPlayer.full_name} was not on that roster.`);
    setQuery("");
    setSelectedPlayer(null);
    setPlayerResults([]);

    if (nextMisses.length >= 3) {
      finishGame(nextMisses, correctPlayers);
    }
  }

  function finishGame(finalMisses = misses, finalCorrect = correctPlayers) {
    const finalSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const finalScore = calculateScore({
      correctCount: finalCorrect.length,
      secondsElapsed: finalSeconds,
      misses: finalMisses.length,
    });

    setEnded(true);
    setSecondsElapsed(finalSeconds);
    setScore(finalScore);
    setMessageType("info");
    setMessage("Run complete.");

    setAttemptSaved(false);
    
    saveAttempt({
      finalScore,
      finalSeconds,
      finalMisses,
      finalCorrect,
    });    
  }

  function giveUp() {
    finishGame(misses, correctPlayers);
  }

  useEffect(() => {
    loadPool();
    loadDailyChallenge();
  }, []);

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
      marginTop: 8,
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
      flexShrink: 0,
    },
    teamRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    logo: {
      width: 52,
      height: 52,
      objectFit: "contain",
      flexShrink: 0,
    },
    statHero: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
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
      marginTop: 8,
      fontSize: 13,
    },
    green: {
      color: "#00C853",
    },
    orange: {
      color: "#EF3B24",
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
    answerTable: {
      display: "grid",
      gap: 4,
      marginTop: 8,
    },
    
    answerHeader: {
      display: "grid",
      gridTemplateColumns: "2.6fr repeat(5, 0.65fr)",
      gap: 4,
      color: theme.muted,
      fontSize: 9,
      fontWeight: 900,
      textTransform: "uppercase",
      padding: "4px 2px",
    },
    
    answerRow: {
      display: "grid",
      gridTemplateColumns: "2.6fr repeat(5, 0.65fr)",
      gap: 4,
      alignItems: "center",
      background: theme.input,
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      padding: 6,
      fontSize: 11,
      fontWeight: 800,
    },
    
    answerPlayer: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      minWidth: 0,
    },

    miniStatLine: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: 800,
      marginTop: 2,
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
                    {leaderboardType === "daily" ? "Daily Name a Dude" : "All-Time Name a Dude"}
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
                          ? `${row.best_score || 0} pts · ${formatTimer(row.best_time || 0)} · Misses ${row.fewest_misses || 0}`
                          : `${row.total_score || 0} pts · Avg ${Math.round(row.avg_score || 0)} · Correct ${row.correct_challenges || 0}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}
            
        {loading ? (
          <section style={styles.card}>Loading Name a Dude...</section>
        ) : !hasStarted ? (
          <>
            <section style={styles.card}>
              <div style={styles.label}>On Demand</div>
              <div style={styles.big}>Name a Dude</div>
              <div style={styles.sub}>
                We give you a season and team. Name one player from that roster.
                Every correct answer spins a new team.
              </div>

              <div style={styles.statHero}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Mode</div>
                  <div style={styles.statValue}>Survival</div>
                </div>

                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Misses</div>
                  <div style={styles.statValue}>3</div>
                </div>

                <div style={styles.statBox}>
                  <div style={styles.statLabel}>League</div>
                  <div style={styles.statValue}>NBA</div>
                </div>
              </div>
            </section>

            <button style={styles.startButton} onClick={startGame}>
              Start
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div>
                <div style={styles.label}>Timer</div>
                <div style={styles.big}>{formatTimer(secondsElapsed)}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={styles.label}>Score</div>
                <div style={styles.big}>{correctPlayers.length}</div>
              </div>
            </div>

            {challenge && (
              <section style={styles.card}>
                <div style={styles.label}>Name a Dude From</div>

                <div style={styles.teamRow}>
                  {challenge.logo_url && (
                    <img src={challenge.logo_url} alt="" style={styles.logo} />
                  )}

                  <div>
                    <div style={styles.big}>{challenge.team_name}</div>
                    <div style={styles.sub}>
                      {challenge.season_label || challenge.season_year} · Roster Size:{" "}
                      {challenge.roster_count}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!ended && (
              <section style={styles.card}>
                <div style={styles.label}>Your Answer</div>

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
                          <img
                            src={p.headshot_url || HEADSHOT_FALLBACK}
                            alt=""
                            style={styles.searchHeadshot}
                          />
                          <span>{p.full_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button style={styles.dangerButton} onClick={giveUp}>
                  Give Up
                </button>

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
                  <div style={styles.statLabel}>Correct</div>
                  <div style={styles.statValue}>{correctPlayers.length}</div>
                </div>

                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Misses</div>
                  <div style={styles.statValue}>{misses.length}/3</div>
                </div>

                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Time</div>
                  <div style={styles.statValue}>{formatTimer(secondsElapsed)}</div>
                </div>
              </div>

              {correctPlayers.map((row, idx) => (
                <div key={`${row.player_id}-${idx}`} style={styles.chainRow}>
                  <img
                    src={row.headshot_url || HEADSHOT_FALLBACK}
                    alt=""
                    style={styles.searchHeadshot}
                  />

                  <div style={{ flex: 1 }}>
                    <strong>✓ {row.full_name}</strong>
                    <div style={styles.sub}>
                      {row.season_label || row.season_year} · {row.team_name}
                    </div>
                    
                    <div style={styles.miniStatLine}>
                      GP {row.games_played ?? "-"} · GS {row.games_started ?? "-"} · PTS{" "}
                      {row.points_per_game ? Number(row.points_per_game).toFixed(1) : "-"} · REB{" "}
                      {row.rebounds_per_game ? Number(row.rebounds_per_game).toFixed(1) : "-"} · AST{" "}
                      {row.assists_per_game ? Number(row.assists_per_game).toFixed(1) : "-"}
                    </div>
                  </div>
                </div>
              ))}

              {misses.map((row, idx) => (
                <div key={`${row.player_id}-${idx}`} style={styles.chainRow}>
                  <img
                    src={row.headshot_url || HEADSHOT_FALLBACK}
                    alt=""
                    style={styles.searchHeadshot}
                  />

                  <div style={{ flex: 1 }}>
                    <strong style={styles.orange}>✕ {row.full_name}</strong>
                    <div style={styles.sub}>
                      Missed on {row.season_label || row.season_year} · {row.team_name}
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
                  Correct {correctPlayers.length} · Misses {misses.length} · Time{" "}
                  {formatTimer(secondsElapsed)}
                </div>

                {challenge?.valid_players?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={styles.label}>Possible Answers</div>
                
                    <div style={styles.answerTable}>
                      <div style={styles.answerHeader}>
                        <div>Player</div>
                        <div>GP</div>
                        <div>GS</div>
                        <div>PTS</div>
                        <div>REB</div>
                        <div>AST</div>
                      </div>
                
                      {challenge.valid_players
                        .slice()
                        .sort((a, b) => String(a.full_name).localeCompare(String(b.full_name)))
                        .map((p) => (
                          <div key={p.player_id} style={styles.answerRow}>
                            <div style={styles.answerPlayer}>
                              <img
                                src={p.headshot_url || HEADSHOT_FALLBACK}
                                alt=""
                                style={styles.searchHeadshot}
                              />
                              <div>
                                <strong>{p.full_name}</strong>
                                <div style={styles.sub}>
                                  {[p.position, p.jersey ? `#${p.jersey}` : null]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              </div>
                            </div>
                
                            <div>{p.games_played ?? "-"}</div>
                            <div>{p.games_started ?? "-"}</div>
                            <div>{p.points_per_game ? Number(p.points_per_game).toFixed(1) : "-"}</div>
                            <div>{p.rebounds_per_game ? Number(p.rebounds_per_game).toFixed(1) : "-"}</div>
                            <div>{p.assists_per_game ? Number(p.assists_per_game).toFixed(1) : "-"}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                  
                <button style={styles.primaryButton} onClick={startGame}>
                  Play Again
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
