"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SiteNav from "../../components/SiteNav";
import ProfileModal from "../../components/ProfileModal";
import SponsorBanner from "../../components/SponsorBanner";
import SportSelector, { getSportOption } from "../../components/SportSelector";

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

const HEADSHOT_FALLBACK = "https://i.ibb.co/1YmfgNKs/TPR-Blank-Headshot-MBB.png";
const DEFAULT_SPORT_KEY = "basketball-nba";
const SPORT_STORAGE_KEY = "thatGuyRockedSport";

const GAME_MODES = [
  { key: "survival", label: "Survival" },
  { key: "race", label: "Race to 10" },
  { key: "decades", label: "Decades" },
];

const DECADE_OPTIONS = ["2000s", "2010s", "2020s"];

function getDifficultyForMode(gameMode, selectedDecade) {
  if (gameMode === "race") return "race";
  if (gameMode === "decades") return `decade-${selectedDecade}`;
  return "open";
}

function getModeLabel(gameMode, selectedDecade) {
  if (gameMode === "race") return "Race to 10";
  if (gameMode === "decades") return selectedDecade;
  return "Survival";
}

function getModeDescription(gameMode, selectedDecade) {
  if (gameMode === "race") return "Name 10 correct players as fast as you can.";
  if (gameMode === "decades") return `Only teams from the ${selectedDecade}.`;
  return "Three misses ends the run.";
}

function decadeBounds(decade) {
  const start = Number(String(decade).replace("s", ""));
  return { start, end: start + 10 };
}

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

function formatNumber(value) {
  return Math.round(Number(value) || 0).toLocaleString();
}

function formatDecimal(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.00";
  return number.toFixed(digits);
}

function secondsPerAnswer(seconds, correct) {
  const correctCount = Number(correct) || 0;
  if (correctCount <= 0) return null;
  return (Number(seconds) || 0) / correctCount;
}

function formatStatCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  if (number > 0 && number < 1) return number.toFixed(3).replace(/^0/, "");
  return Number.isInteger(number) ? number.toLocaleString() : number.toFixed(1);
}

function nameADudeStatColumns(sport) {
  if (sport === "baseball") {
    return [
      ["G", (row) => row.batting_games ?? row.pitching_games ?? row.games_played],
      ["HR", (row) => row.home_runs],
      ["RBI", (row) => row.rbi],
      ["OPS", (row) => row.ops],
      ["K", (row) => row.pitching_strikeouts],
    ];
  }

  return [
    ["GP", (row) => row.games_played],
    ["GS", (row) => row.games_started],
    ["PTS", (row) => row.points_per_game],
    ["REB", (row) => row.rebounds_per_game],
    ["AST", (row) => row.assists_per_game],
  ];
}

const STATIC_STYLES = {
  page: { minHeight: "100vh", width: "100%", overflowX: "hidden", fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 },
  wrap: {maxWidth: 520, minHeight: "100vh", margin: "0 auto", padding: "12px 12px 170px", display: "flex", flexDirection: "column",},
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, marginBottom: 10 },
  title: { fontFamily: "'Roboto Slab', Rockwell, serif", fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.04em", textTransform: "uppercase" },
  sub: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: 8, padding: 12, marginBottom: 10 },
  label: { fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 },
  big: { fontSize: 22, fontWeight: 900, marginBottom: 2 },
  iconButton: { width: 36, height: 36, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  startButton: { border: "1px solid #EF3B24", background: "#EF3B24", color: "#ffffff", padding: "15px", fontWeight: 950, borderRadius: 6, cursor: "pointer", textTransform: "uppercase", width: "100%", fontSize: 18 },
  primaryButton: { border: "1px solid #003594", background: "#003594", color: "#ffffff", padding: "11px", fontWeight: 900, borderRadius: 6, cursor: "pointer", textTransform: "uppercase", width: "100%", fontSize: 13, marginTop: 8 },
  dangerButton: { border: "1px solid #EF3B24", background: "transparent", color: "#EF3B24", padding: "6px 12px", fontWeight: 900, borderRadius: 6, cursor: "pointer", textTransform: "uppercase", fontSize: 11, width: "auto" },
  hudRightRow: { display: "flex", alignItems: "center", gap: 12, textAlign: "right" },
  input: { width: "100%", boxSizing: "border-box", padding: "11px", borderRadius: 6, fontSize: 15, marginBottom: 7 },
  searchSubmitRow: { display: "grid", gridTemplateColumns: "4fr 1fr", gap: 8, alignItems: "start" },
  // FIX #1: Added missing style definition to guarantee heights and corners map cleanly
  smallSubmitButton: { padding: "11px", borderRadius: 6, fontWeight: 900, textTransform: "uppercase", fontSize: 12, width: "100%", boxSizing: "border-box", textAlign: "center" },
  resultList: { marginBottom: 8, borderRadius: 6, overflow: "hidden" },
  resultItem: { padding: 10, cursor: "pointer", fontWeight: 800, fontSize: 14 },
  searchResultRow: { display: "flex", alignItems: "center", gap: 8 },
  searchHeadshot: { width: 28, height: 28, objectFit: "cover", borderRadius: 5, flexShrink: 0 },
  teamRow: { display: "flex", alignItems: "center", gap: 10 },
  logo: { width: 52, height: 52, objectFit: "contain", flexShrink: 0 },
  statHero: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 },
  statBox: { padding: "8px 6px", borderRadius: 6, textAlign: "center" },
  statLabel: { fontSize: 9, fontWeight: 900, textTransform: "uppercase" },
  statValue: { fontSize: 18, fontWeight: 950, marginTop: 2 },
  chainRow: { display: "flex", alignItems: "center", gap: 8, borderRadius: 6, padding: 8, marginTop: 8 },
  message: { fontWeight: 900, marginTop: 8, fontSize: 13 },
  orange: { color: "#EF3B24" },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 },
  modalCard: { width: "100%", maxWidth: 520, maxHeight: "82vh", overflowY: "auto", borderRadius: 10, padding: 14 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  closeButton: { borderRadius: 6, cursor: "pointer", width: 34, height: 34, fontWeight: 950 },
  tabs: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6, marginBottom: 10 },
  tab: { padding: "8px 5px", borderRadius: 6, fontWeight: 900, cursor: "pointer", textAlign: "center", textTransform: "uppercase", fontSize: 10 },
  activeTab: { background: "transparent", borderBottom: "3px solid #EF3B24" },
  leaderboardAvatar: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  leaderboardAvatarFallback: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 },    
  answerTable: { display: "grid", gap: 4, marginTop: 8 },
  answerHeader: { display: "grid", gridTemplateColumns: "2.6fr repeat(5, 0.65fr)", gap: 4, fontSize: 9, fontWeight: 900, textTransform: "uppercase", padding: "4px 2px" },
  answerRow: { display: "grid", gridTemplateColumns: "2.6fr repeat(5, 0.65fr)", gap: 4, alignItems: "center", borderRadius: 6, padding: 6, fontSize: 11, fontWeight: 800 },
  answerPlayer: { display: "flex", alignItems: "center", gap: 7, minWidth: 0 },
  miniStatLine: { fontSize: 10, fontWeight: 800, marginTop: 2 },
  shareGrid: { display: "flex", gap: 10, marginTop: 8, marginBottom: 12, alignItems: "center" },
  shareIconButton: { width: 44, height: 44, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950, fontSize: 18 },    
  postGameButtonRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }
};

export default function NameADudePage() {
  const [selectedSportKey, setSelectedSportKey] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SPORT_KEY;
    return getSportOption(window.localStorage?.getItem(SPORT_STORAGE_KEY)).key;
  });
  const [challenge, setChallenge] = useState(null);
  const [usedTeamKeys, setUsedTeamKeys] = useState([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [pool, setPool] = useState([]);
  const [totalPoolCount, setTotalPoolCount] = useState(null);
  const [allTeamIds, setAllTeamIds] = useState([]);

  const [hasStarted, setHasStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [searching, setSearching] = useState(false);
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

  const [gameMode, setGameMode] = useState("survival");
  const [selectedDecade, setSelectedDecade] = useState("2010s");
  const [poolStats, setPoolStats] = useState({ all: 748 });
  const activeSportOption = getSportOption(selectedSportKey);
  const ACTIVE_SPORT = activeSportOption.sport;
  const ACTIVE_LEAGUE = activeSportOption.league;
  
  const lastCorrectAtRef = useRef(null);  

  const searchTimeoutRef = useRef(null);

  function handleSportChange(nextSportKey) {
    setSelectedSportKey(nextSportKey);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SPORT_STORAGE_KEY, nextSportKey);
    }
    setShowLeaderboard(false);
  }

  useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    setDarkMode(Boolean(prefersDark));
  }, []);

  const theme = useMemo(() => {
    return darkMode
      ? { bg: "#050505", card: "#181818", pane: "#242424", text: "#ffffff", muted: "#b5b5b5", border: "#333333", input: "#0f0f0f" }
      : { bg: "#ffffff", card: "#f6f6f6", pane: "#eeeeee", text: "#111111", muted: "#555555", border: "#d8d8d8", input: "#ffffff" };
  }, [darkMode]);

  const styles = useMemo(() => {
    const merged = JSON.parse(JSON.stringify(STATIC_STYLES));
    merged.page.background = theme.bg; merged.page.color = theme.text;
    merged.topbar.borderBottom = `2px solid ${theme.border}`;
    merged.sub.color = theme.muted;
    merged.card.background = theme.card; merged.card.border = `1px solid ${theme.border}`;
    merged.label.color = theme.muted;
    merged.iconButton.border = `1px solid ${theme.border}`; merged.iconButton.background = theme.card; merged.iconButton.color = theme.text;
    merged.input.border = `1px solid ${theme.border}`; merged.input.background = theme.input; merged.input.color = theme.text;
    merged.smallSubmitButton.border = `1px solid ${theme.border}`;
    merged.resultList.border = `1px solid ${theme.border}`; merged.resultList.background = theme.input;
    merged.resultItem.borderBottom = `1px solid ${theme.border}`;
    merged.searchHeadshot.background = theme.pane; merged.searchHeadshot.border = `1px solid ${theme.border}`;
    merged.statBox.background = theme.input; merged.statBox.borderTop = `2px solid ${theme.border}`;
    merged.statLabel.color = theme.muted;
    merged.chainRow.background = theme.input; merged.chainRow.border = `1px solid ${theme.border}`;
    merged.modalCard.background = theme.card; merged.modalCard.color = theme.text; merged.modalCard.border = `1px solid ${theme.border}`;
    merged.closeButton.border = `1px solid ${theme.border}`; merged.closeButton.background = theme.pane; merged.closeButton.color = theme.text;
    merged.tab.border = `1px solid ${theme.border}`; merged.tab.background = theme.card; merged.tab.color = theme.text;
    merged.leaderboardAvatar.border = `1px solid ${theme.border}`;
    merged.leaderboardAvatarFallback.background = darkMode ? "#003594" : "#E8F0FF"; merged.leaderboardAvatarFallback.color = darkMode ? "#ffffff" : "#003594"; merged.leaderboardAvatarFallback.border = `1px solid ${theme.border}`;
    merged.answerHeader.color = theme.muted;
    merged.answerRow.background = theme.input; merged.answerRow.border = `1px solid ${theme.border}`;
    merged.miniStatLine.color = theme.muted;
    merged.shareIconButton.border = `1px solid ${theme.border}`; merged.shareIconButton.background = theme.input; merged.shareIconButton.color = theme.text;
    return merged;
  }, [theme, darkMode]);

  async function loadProfile(userId) {
    if (!userId) { setProfile(null); return; }
    const { data, error } = await supabase.from("profiles").select("username, display_name, avatar_url").eq("id", userId).maybeSingle();
    if (!error) setProfile(data || null);
  }

  async function loadStartup() {
    setLoading(true);
  
    // Load today's Name a Dude challenge id
    const { data, error } = await supabase
      .from("nba_trivia_challenges")
      .select("id")
      .eq("challenge_type", "name_a_dude")
      .eq("challenge_date", todayLocal())
      .eq("sport", ACTIVE_SPORT)
      .eq("league", ACTIVE_LEAGUE)
      .eq("is_active", true)
      .maybeSingle();
  
    if (!error && data) {
      setDailyChallengeId(data.id);
    }
  
    // Load precomputed pool counts for all/decade random offsets
    const { data: statsData } = await supabase
      .from("vw_name_a_dude_pool_stats")
      .select("pool_key, row_count")
      .eq("sport", ACTIVE_SPORT)
      .eq("league", ACTIVE_LEAGUE);
  
    if (statsData) {
      setPoolStats(
        statsData.reduce((acc, row) => {
          acc[row.pool_key] = Number(row.row_count || 0);
          return acc;
        }, { all: 748 })
      );
    }
  
    setLoading(false);
  }

  async function fetchRandomTeamFromDB(usedKeys = usedTeamKeys) {
    setChallengeLoading(true);
  
    const poolKey = gameMode === "decades" ? selectedDecade : "all";
    const totalRows = poolStats[poolKey] || poolStats.all || 748;
    const maxOffset = Math.max(0, totalRows - 10);
    const randomOffset = Math.floor(Math.random() * maxOffset);
  
    let queryBuilder = supabase
      .from("name_a_dude_pool_cache")
      .select("*")
      .eq("sport", ACTIVE_SPORT)
      .eq("league", ACTIVE_LEAGUE);
  
    if (gameMode === "decades") {
      const { start, end } = decadeBounds(selectedDecade);
      queryBuilder = queryBuilder.gte("season_year", start).lt("season_year", end);
    }
  
    const { data, error } = await queryBuilder.range(randomOffset, randomOffset + 9);
  
    let activeData = data;
  
    if (error || !activeData || activeData.length === 0) {
      let fallbackQuery = supabase
        .from("name_a_dude_pool_cache")
        .select("*")
        .eq("sport", ACTIVE_SPORT)
        .eq("league", ACTIVE_LEAGUE);
  
      if (gameMode === "decades") {
        const { start, end } = decadeBounds(selectedDecade);
        fallbackQuery = fallbackQuery.gte("season_year", start).lt("season_year", end);
      }
  
      const fallback = await fallbackQuery.limit(10);
  
      if (fallback.data && fallback.data.length > 0) {
        activeData = fallback.data;
      } else {
        setChallengeLoading(false);
        return null;
      }
    }
  
    const freshTeams = activeData.filter((team) => !usedKeys.includes(team.team_key));
  
    const finalSelection =
      freshTeams.length > 0
        ? freshTeams[Math.floor(Math.random() * freshTeams.length)]
        : activeData[Math.floor(Math.random() * activeData.length)];
  
    setChallenge(finalSelection);
    setUsedTeamKeys((prev) => [...prev, finalSelection.team_key]);
    setChallengeLoading(false);
    return finalSelection;
  }
  
  function handleSearchChange(value) {
    setQuery(value);
    setSelectedPlayer(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const q = value.trim();
    if (q.length < 3) {
      setPlayerResults([]);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from("nba_players")
        .select("id, full_name")
        .ilike("full_name", `%${q}%`)
        .eq("sport", ACTIVE_SPORT)
        .eq("league", ACTIVE_LEAGUE)
        .limit(8);

      if (!error && data) {
        setPlayerResults(data);
      }
      setSearching(false);
    }, 300); 
  }

  function resetRun() {
    setHasStarted(false); setStartedAt(null); setSecondsElapsed(0); setEnded(false);
    setQuery(""); setPlayerResults([]); setSelectedPlayer(null); setCorrectPlayers([]);
    setMisses([]); setMessage(""); setMessageType("info"); setScore(null); setUsedTeamKeys([]); setChallenge(null);
    lastCorrectAtRef.current = null;
  }

  async function startGame() {
    resetRun();
    setHasStarted(true);
    setStartedAt(Date.now());
  
    const firstChallenge = await fetchRandomTeamFromDB([]);
  
    if (!firstChallenge) {
      setMessageType("error");
      setMessage("Could not load a challenge. Try again.");
    }
  }

  function getValidPlayerMatch(playerId) {
    const validPlayers = challenge?.valid_players || [];
    return validPlayers.find((p) => Number(p.player_id) === Number(playerId));
  }

  function alreadyNamed(playerId) {
    return correctPlayers.some((p) => Number(p.player_id) === Number(playerId));
  }

  async function submitGuess() {
    if (!challenge || !selectedPlayer || ended) return;

    if (alreadyNamed(selectedPlayer.id)) {
      setMessageType("error");
      setMessage("Already named that dude.");
      return;
    }

    const match = getValidPlayerMatch(selectedPlayer.id);

    if (match) {
      const now = Date.now();
    
      if (lastCorrectAtRef.current && now - lastCorrectAtRef.current < 1000) {
        setMessageType("error");
        setMessage("Slow down. One answer per second.");
        return;
      }
    
      lastCorrectAtRef.current = now;
    
      const correctRow = {
        player_id: selectedPlayer.id,
        full_name: selectedPlayer.full_name,
        headshot_url: selectedPlayer.headshot_url || match.headshot_url,
        team_key: challenge.team_key,
        team_name: challenge.display_team_name,
        season_year: challenge.season_year,
        season_label: challenge.season_label,
        jersey: match.jersey,
        position: match.position,
        games_played: match.games_played,
        games_started: match.games_started,
        points_per_game: match.points_per_game,
        rebounds_per_game: match.rebounds_per_game,
        assists_per_game: match.assists_per_game,
        batting_games: match.batting_games,
        hits: match.hits,
        home_runs: match.home_runs,
        rbi: match.rbi,
        stolen_bases: match.stolen_bases,
        batting_avg: match.batting_avg,
        ops: match.ops,
        pitching_games: match.pitching_games,
        pitching_games_started: match.pitching_games_started,
        wins: match.wins,
        saves: match.saves,
        era: match.era,
        whip: match.whip,
        pitching_strikeouts: match.pitching_strikeouts,
      };
    
      const nextCorrectPlayers = [...correctPlayers, correctRow];
    
      setCorrectPlayers(nextCorrectPlayers);
      setMessageType("success");
      setMessage(gameMode === "race" && nextCorrectPlayers.length >= 10 ? "Race complete." : "Correct. New team.");
      setQuery("");
      setSelectedPlayer(null);
      setPlayerResults([]);
    
      if (gameMode === "race" && nextCorrectPlayers.length >= 10) {
        finishGame(misses, nextCorrectPlayers);
        return;
      }
    
      await fetchRandomTeamFromDB();
      return;
    }

    const missRow = {
      player_id: selectedPlayer.id,
      full_name: selectedPlayer.full_name,
      headshot_url: selectedPlayer.headshot_url,
      team_key: challenge.team_key,
      team_name: challenge.display_team_name,
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
    const finalScore = calculateScore({ correctCount: finalCorrect.length, secondsElapsed: finalSeconds, misses: finalMisses.length });
    setEnded(true); setSecondsElapsed(finalSeconds); setScore(finalScore); setMessageType("info"); setMessage("Run complete."); setAttemptSaved(false);
    saveAttempt({ finalScore, finalSeconds, finalMisses, finalCorrect });  
  }

  async function saveAttempt({ finalScore, finalSeconds, finalMisses, finalCorrect }) {
    if (!user || !dailyChallengeId) return;
  
    const difficulty = getDifficultyForMode(gameMode, selectedDecade);
    const isTooFastRace = gameMode === "race" && finalCorrect.length >= 10 && finalSeconds < 10;
  
    const { error } = await supabase.from("nba_trivia_attempts").insert({
      challenge_id: dailyChallengeId,
      user_id: user.id,
      guessed_player_id: finalCorrect.length > 0 ? finalCorrect[finalCorrect.length - 1].player_id : null,
      is_correct: finalCorrect.length > 0,
      seconds_elapsed: finalSeconds,
      wrong_guess_count: finalMisses.length,
      hints_used: 0,
      score: isTooFastRace ? 0 : finalScore,
      gave_up: finalMisses.length < 3 && !(gameMode === "race" && finalCorrect.length >= 10),
      completed: true,
      final_guess_count: finalCorrect.length + finalMisses.length,
      difficulty,
      challenge_date: todayLocal(),
      completed_at: new Date().toISOString(),
      chain_length: finalCorrect.length,
      challenge_type: "name_a_dude",
      sport: ACTIVE_SPORT,
      league: ACTIVE_LEAGUE,
      result_json: {
        game: "name_a_dude",
        mode: gameMode,
        decade: gameMode === "decades" ? selectedDecade : null,
        anti_bot: {
          min_one_second_per_correct: true,
          flagged_too_fast_race: isTooFastRace,
        },
        sport: ACTIVE_SPORT,
        league: ACTIVE_LEAGUE,
        correct_players: finalCorrect,
        misses: finalMisses,
      },
    });
  
    if (!error) setAttemptSaved(true);
    else console.error(error);
  }

  async function loadLeaderboard(type = leaderboardType) {
    const difficulty = getDifficultyForMode(gameMode, selectedDecade);
  
    if (type === "daily" && dailyChallengeId) {
      const { data, error } = await supabase
        .from("vw_nba_trivia_daily_challenge_leaderboard")
        .select("username, avatar_url, best_score, best_time, fewest_misses, correct, hints_used, chain_length")
        .eq("challenge_id", dailyChallengeId)
        .eq("difficulty", difficulty)
        .order("best_score", { ascending: false })
        .limit(10);
  
      if (!error) setLeaderboard(data || []);
      return;
    }
  
    const { data, error } = await supabase
      .from("vw_nba_trivia_all_time_leaderboard")
      .select("username, avatar_url, total_score, avg_score, correct_challenges, total_correct, avg_correct, total_misses, avg_misses, total_seconds, seconds_per_answer")
      .eq("challenge_type", "name_a_dude")
      .eq("difficulty", difficulty)
      .eq("sport", ACTIVE_SPORT)
      .eq("league", ACTIVE_LEAGUE)
      .order("total_score", { ascending: false })
      .limit(10);
  
    if (!error) setLeaderboard(data || []);
  }

  function giveUp() { finishGame(misses, correctPlayers); }
  function selectGameMode() {resetRun();}
  function formatShareDate(dateString) { const d = new Date(dateString + "T00:00:00"); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; }
  function nameADudeShareText() { return `${correctPlayers.length} correct, ${misses.length} misses, â±ï¸ ${formatTimer(secondsElapsed)}\n${"âœ…".repeat(correctPlayers.length)}${"ðŸŸ¥".repeat(misses.length)}`; }
  function getShareText(gameName, scoreText) { return `${gameName} | ${formatShareDate(todayLocal())}\n${scoreText}\n\nTry to beat my score: ${window.location.origin}/name-a-dude`; }
  function openTwitterShare(gameName, scoreText) { const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText(gameName, scoreText))}`; window.open(url, "_blank", "noopener,noreferrer"); }
  async function openFacebookShare(gameName, scoreText) { await navigator.clipboard.writeText(getShareText(gameName, scoreText)); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/name-a-dude`)}`, "_blank", "noopener,noreferrer"); alert("Score copied. Paste it into your Facebook post."); }
  async function copyShareText(gameName, scoreText) { await navigator.clipboard.writeText(getShareText(gameName, scoreText)); alert("Score copied to clipboard."); }
  function openEmailShare(gameName, scoreText) { window.location.href = `mailto:?subject=${encodeURIComponent("That Guy Rocked score")}&body=${encodeURIComponent(getShareText(gameName, scoreText))}`; }
  async function shareResult(gameName, scoreText) { if (navigator.share) { await navigator.share({ title: "That Guy Rocked", text: getShareText(gameName, scoreText) }); } else { await navigator.clipboard.writeText(getShareText(gameName, scoreText)); alert("Score copied to clipboard."); } }

  useEffect(() => {
    resetRun();
    setDailyChallengeId(null);
    setPoolStats({ all: 748 });
    loadStartup();
  }, [ACTIVE_SPORT, ACTIVE_LEAGUE]);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;
      setUser(currentUser); loadProfile(currentUser?.id);
    }
    loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser); loadProfile(currentUser?.id);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasStarted || ended || !startedAt) return;
    const timer = setInterval(() => { setSecondsElapsed(Math.floor((Date.now() - startedAt) / 1000)); }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, ended, startedAt]);

  const smallSubmitStyle = {
    ...styles.smallSubmitButton,
    border: `1px solid ${selectedPlayer ? "#003594" : theme.border}`,
    background: selectedPlayer ? "#003594" : theme.pane,
    color: selectedPlayer ? "#ffffff" : theme.muted,
    cursor: selectedPlayer ? "pointer" : "not-allowed",
  };
  const answerColumns = nameADudeStatColumns(ACTIVE_SPORT);

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>That Guy Rocked</h1>
            <div style={styles.sub}>
              <Link href="/" style={{ color: "inherit" }}>Back to Games Home</Link>
            </div>
          </div>
          <button style={styles.iconButton} onClick={() => setShowMenu(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        <SiteNav
          showMenu={showMenu} setShowMenu={setShowMenu} setShowProfile={setShowProfile}
          darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} user={user} profile={profile}
          username={profile?.username || username} showLeaderboardButton={true}
          onLeaderboardClick={() => { setLeaderboardType("daily"); loadLeaderboard("daily"); setShowLeaderboard(true); }}
        />

        <ProfileModal show={showProfile} onClose={() => setShowProfile(false)} user={user} setUser={setUser} darkMode={darkMode} theme={theme} />

        <SportSelector
          value={selectedSportKey}
          onChange={handleSportChange}
          theme={theme}
        />

        {showLeaderboard && (
          <div style={styles.modalBackdrop}>
            <section style={styles.modalCard}>
              <div style={styles.modalHeader}>
                <div>
                  <div style={styles.label}>Leaderboard</div>
                  <div style={styles.big}>
                    {leaderboardType === "daily" ? "Daily" : "All-Time"} Name a Dude · {getModeLabel(gameMode, selectedDecade)}
                  </div>
                </div>
                <button style={styles.closeButton} onClick={() => setShowLeaderboard(false)}>Ã—</button>
              </div>
        
              <div style={styles.tabs}>
                <button style={{ ...styles.tab, ...(leaderboardType === "daily" ? styles.activeTab : {}) }} onClick={() => { setLeaderboardType("daily"); loadLeaderboard("daily"); }}>Daily</button>
                <button style={{ ...styles.tab, ...(leaderboardType === "alltime" ? styles.activeTab : {}) }} onClick={() => { setLeaderboardType("alltime"); loadLeaderboard("alltime"); }}>All Time</button>
              </div>
        
              {leaderboard.length === 0 ? (
                <div style={styles.sub}>No leaderboard results yet.</div>
              ) : (
                leaderboard.map((row, idx) => (
                  <div key={`${row.username}-${idx}`} style={styles.chainRow}>
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" style={styles.leaderboardAvatar} />
                    ) : (
                      <div style={styles.leaderboardAvatarFallback}>{(row.username || "?").charAt(0).toUpperCase()}</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <strong>{idx + 1}. {row.username || "Guest"}</strong>
                      <div style={styles.sub}>
                        {(() => {
                          const isRace = gameMode === "race";
                        
                          if (leaderboardType === "daily") {
                            const spa = secondsPerAnswer(row.best_time, row.chain_length);
                        
                            if (isRace) {
                              return `${formatNumber(row.best_score)} PTS · ${formatTimer(row.best_time || 0)} · ${formatDecimal(spa)} Seconds/answer · ${formatNumber(row.fewest_misses)} Misses`;
                            }
                        
                            return `${formatNumber(row.best_score)} PTS · ${formatTimer(row.best_time || 0)} · ${formatNumber(row.chain_length)} Correct · ${formatDecimal(spa)} Seconds/answer`;
                          }
                        
                          if (isRace) {
                            return `${formatNumber(row.total_score)} Total PTS (Avg ${formatNumber(row.avg_score)}) · ${formatDecimal(row.seconds_per_answer)} Seconds/answer · ${formatNumber(row.total_misses)} Total Misses (Avg ${formatDecimal(row.avg_misses)})`;
                          }
                        
                          return `${formatNumber(row.total_score)} Total PTS (Avg ${formatNumber(row.avg_score)}) · Total Correct ${formatNumber(row.total_correct)} (Avg ${formatDecimal(row.avg_correct, 1)}) · ${formatDecimal(row.seconds_per_answer)} Seconds/answer`;
                        })()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {ended && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ ...styles.label, marginTop: 14 }}>Share</div>
                  <div style={styles.shareGrid}>
                    <button style={styles.shareIconButton} onClick={() => openTwitterShare("Name a Dude", nameADudeShareText())}>X</button>
                    <button style={styles.shareIconButton} onClick={() => openFacebookShare("Name a Dude", nameADudeShareText())}>f</button>
                    <button style={styles.shareIconButton} onClick={() => copyShareText("Name a Dude", nameADudeShareText())}>
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                    <button style={styles.shareIconButton} onClick={() => shareResult("Name a Dude", nameADudeShareText())}>
                      <span className="material-symbols-outlined">chat_bubble</span>
                    </button>
                    <button style={styles.shareIconButton} onClick={() => openEmailShare("Name a Dude", nameADudeShareText())}>
                      <span className="material-symbols-outlined">drafts</span>
                    </button>
                  </div>
              
                  <div style={{ ...styles.postGameButtonRow, gridTemplateColumns: "1fr 1fr" }}>
                    <button style={styles.primaryButton} onClick={() => { setShowLeaderboard(false); selectGameMode(); }}>Play Again</button>
                    <button style={styles.primaryButton} onClick={() => { setShowLeaderboard(false); selectGameMode(); }}>Game Modes</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
            
        {loading ? (
          <section style={styles.card}>Loading Name a Dude...</section>
        ) : !hasStarted ? (
          <>
            <section style={styles.card}>
              <div style={styles.label}>Play as many times as you want!</div>
              <div style={styles.big}>Name a Dude</div>
              <div style={styles.sub}>We give you a season and team. Name one player from that roster. Every correct answer spins a new team.</div>
              <div style={styles.statHero}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Mode</div>
                  <div style={styles.statValue}>{getModeLabel(gameMode, selectedDecade)}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Misses</div>
                  <div style={styles.statValue}>3</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Goal</div>
                  <div style={styles.statValue}>{gameMode === "race" ? "10" : "Run"}</div>
                </div>
              </div>
              
              <div style={{ ...styles.tabs, gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: 10 }}>
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    style={{
                      ...styles.tab,
                      ...(gameMode === mode.key ? styles.activeTab : {}),
                    }}
                    onClick={() => setGameMode(mode.key)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              
              {gameMode === "decades" && (
                <select
                  style={styles.input}
                  value={selectedDecade}
                  onChange={(e) => setSelectedDecade(e.target.value)}
                >
                  {DECADE_OPTIONS.map((decade) => (
                    <option key={decade} value={decade}>
                      {decade}
                    </option>
                  ))}
                </select>
              )}
              
              <div style={styles.sub}>{getModeDescription(gameMode, selectedDecade)}</div>
            </section>
            <button style={styles.startButton} onClick={startGame}>Start</button>
          </>
) : (
          <>
            {/* UPDATED HUD TOP BAR */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={styles.label}>Timer</div>
                <div style={styles.big}>{formatTimer(secondsElapsed)}</div>
              </div>
              <div style={styles.hudRightRow}>
                <div>
                  <div style={styles.label}>{gameMode === "race" ? "Race" : "Score"}</div>
                  <div style={styles.big}>
                    {gameMode === "race" ? `${correctPlayers.length}/10` : correctPlayers.length}
                  </div>
                </div>
                {!ended && (
                  <button style={styles.dangerButton} onClick={giveUp}>Give Up</button>
                )}
              </div>
            </div>

            {challenge && (
              <section style={styles.card}>
                <div style={styles.label}>Name a Dude From</div>
                <div style={styles.teamRow}>
                  {(challenge.display_logo_url || challenge.logo_url) && (<img src={challenge.display_logo_url} alt="" style={styles.logo} /> )}
                  <div>
                    <div style={styles.big}>{challenge.display_team_name}</div>
                    <div style={styles.sub}>{challenge.season_label || challenge.season_year} · Roster Size: {challenge.roster_count}</div>
                  </div>
                </div>
              </section>
            )}

            {!ended && challengeLoading && <section style={styles.card}>Loading next team...</section>}
            
            {!ended && !challengeLoading && challenge && (
              <section style={styles.card}>
                <div style={styles.label}>Your Answer</div>
                <div style={styles.searchSubmitRow}>
                  <input
                    style={styles.input}
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search player..."
                  />
                  <button style={smallSubmitStyle} disabled={!selectedPlayer} onClick={submitGuess}>Submit</button>
                </div>

                {searching && <div style={{...styles.sub, paddingBottom: 5}}>Searching roster databases...</div>}

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
                          <span>{p.full_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* REMOVED DANGER BUTTON FROM HERE */}
                {message && <div style={{ ...styles.message, color: messageType === "success" ? "#00C853" : "#EF3B24" }}>{message}</div>}
              </section>
            )}

            {/* FIX #3: Relocated game result summary cards and call-to-actions straight above the lists */}
            {ended && (
              <section style={styles.card}>
                <div style={styles.label}>Result</div>
                <div style={styles.big}>Score: {score ?? 0}</div>
                <div style={styles.sub}>Correct {correctPlayers.length} · Misses {misses.length} · Time {formatTimer(secondsElapsed)}</div>

                <div style={{ ...styles.postGameButtonRow, gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <button style={styles.primaryButton} onClick={selectGameMode}>Play Again</button>
                  <button style={styles.primaryButton} onClick={selectGameMode}>Game Modes</button>
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
                  <button style={styles.shareIconButton} onClick={() => openTwitterShare("Name a Dude", nameADudeShareText())}>X</button>
                  <button style={styles.shareIconButton} onClick={() => openFacebookShare("Name a Dude", nameADudeShareText())}>f</button>
                  <button style={styles.shareIconButton} onClick={() => copyShareText("Name a Dude", nameADudeShareText())}>
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                  <button style={styles.shareIconButton} onClick={() => shareResult("Name a Dude", nameADudeShareText())}>
                    <span className="material-symbols-outlined">chat_bubble</span>
                  </button>
                  <button style={styles.shareIconButton} onClick={() => openEmailShare("Name a Dude", nameADudeShareText())}>
                    <span className="material-symbols-outlined">drafts</span>
                  </button>
                </div>
              </section>
            )}

            <section style={styles.card}>
              <div style={styles.label}>Run Overview</div>
              <div style={styles.statHero}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Correct</div>
                  <div style={styles.statValue}>
                    {gameMode === "race" ? `${correctPlayers.length}/10` : correctPlayers.length}
                  </div>
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
                  <img src={row.headshot_url || HEADSHOT_FALLBACK} alt="" style={styles.searchHeadshot} />
                  <div style={{ flex: 1 }}>
                    <strong>âœ“ {row.full_name}</strong>
                    <div style={styles.sub}>{row.season_label || row.season_year} · {row.team_name}</div>
                    <div style={styles.miniStatLine}>
                      {answerColumns
                        .map(([label, getter]) => `${label} ${formatStatCell(getter(row))}`)
                        .join(" · ")}
                    </div>
                  </div>
                </div>
              ))}

              {misses.map((row, idx) => (
                <div key={`${row.player_id}-${idx}`} style={styles.chainRow}>
                  <img src={row.headshot_url || HEADSHOT_FALLBACK} alt="" style={styles.searchHeadshot} />
                  <div style={{ flex: 1 }}>
                    <strong style={styles.orange}>âœ• {row.full_name}</strong>
                    <div style={styles.sub}>Missed on {row.season_label || row.season_year} · {row.team_name}</div>
                  </div>
                </div>
              ))}
            </section>

            {ended && challenge?.valid_players?.length > 0 && (
              <section style={styles.card}>
                <div style={styles.label}>Possible Answers</div>
                <div style={styles.answerTable}>
                  <div style={styles.answerHeader}>
                    <div>Player</div>
                    {answerColumns.map(([label]) => (<div key={label}>{label}</div>))}
                  </div>
            
                  {challenge.valid_players
                    .slice()
                    .sort((a, b) => {
                      const getter = answerColumns[0]?.[1];
                      return Number(getter?.(b) || 0) - Number(getter?.(a) || 0);
                    })
                    .map((p) => (
                      <div key={p.player_id} style={styles.answerRow}>
                        <div style={styles.answerPlayer}>
                          <img src={p.headshot_url || HEADSHOT_FALLBACK} alt="" style={styles.searchHeadshot} />
                          <div>
                            <strong>{p.full_name}</strong>
                            <div style={styles.sub}>{[p.position, p.jersey ? `#${p.jersey}` : null].filter(Boolean).join(" · ")}</div>
                          </div>
                        </div>
                        {answerColumns.map(([label, getter]) => (
                          <div key={label}>{formatStatCell(getter(p))}</div>
                        ))}
                      </div>
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
