"use client";

import Link from "next/link";

export default function SiteNav({
  showMenu,
  setShowMenu,
  setShowProfile,
  darkMode,
  setDarkMode,
  theme,
  user,
  profile,
  username,
  showLeaderboardButton,
  onLeaderboardClick,  
}) {
  if (!showMenu) return null;

  const styles = {
    drawerBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.62)",
      zIndex: 100,
      display: "flex",
      justifyContent: "flex-end",
    },
    drawerPanel: {
      width: "58%",
      maxWidth: 340,
      minWidth: 235,
      height: "100vh",
      background: theme.card,
      color: theme.text,
      borderLeft: `1px solid ${theme.border}`,
      padding: 14,
      boxSizing: "border-box",
      boxShadow: "-12px 0 30px rgba(0,0,0,0.35)",
      display: "flex",
      flexDirection: "column",
    },
    drawerHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
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
    label: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 2,
    },
    big: {
      fontSize: 22,
      fontWeight: 900,
      fontFamily: "'Roboto Slab', Rockwell, serif",
    },
    sub: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 2,
    },
    menuItem: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      color: theme.text,
      padding: "10px 2px",
      fontWeight: 900,
      fontSize: 16,
      textDecoration: "none",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      marginBottom: 12,
    },
    menuIcon: {
      fontSize: 20,
      color: theme.text,
    },
    profileMenuItem: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "transparent",
      border: "none",
      color: theme.text,
      padding: "8px 2px",
      cursor: "pointer",
      marginTop: 24,
    },
    drawerAvatar: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      objectFit: "cover",
      border: `1px solid ${theme.border}`,
      flexShrink: 0,
    },    
    drawerAvatarFallback: {
      width: 36,
      height: 36,
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

  return (
    <div style={styles.drawerBackdrop} onClick={() => setShowMenu(false)}>
      <aside style={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.label}>Navigation</div>
            <div style={styles.big}>That Guy Rocked</div>
          </div>

          <button style={styles.closeButton} onClick={() => setShowMenu(false)}>
            ×
          </button>
        </div>

        <Link href="/" style={styles.menuItem}>
          <span className="material-symbols-outlined" style={styles.menuIcon}>
            home
          </span>
          Home
        </Link>

        <Link href="/ball-knowledgy" style={styles.menuItem}>
          <span className="material-symbols-outlined" style={styles.menuIcon}>
            quiz
          </span>
          Ball Knowledgy
        </Link>

        <Link href="/ladder-golf" style={styles.menuItem}>
          <span className="material-symbols-outlined" style={styles.menuIcon}>
            tools_ladder
          </span>
          Ladder Golf
        </Link>
        {showLeaderboardButton && (
          <button
            style={styles.menuItem}
            onClick={() => {
              setShowMenu(false);
              onLeaderboardClick?.();
            }}
          >
            <span className="material-symbols-outlined" style={styles.menuIcon}>
              leaderboard
            </span>
            Leaderboard
          </button>
        )}
        <button
          style={styles.menuItem}
          onClick={() => {
            setDarkMode(!darkMode);
            setShowMenu(false);
          }}
        >
          <span className="material-symbols-outlined" style={styles.menuIcon}>
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>

        <button
          style={styles.profileMenuItem}
          onClick={() => {
            setShowMenu(false);
            setShowProfile(true);
          }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={styles.drawerAvatar}
            />
          ) : (
            <div style={styles.drawerAvatarFallback}>
              {(profile?.username || username || user?.email || "P")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          
          <div>
            <div style={{ fontWeight: 900 }}>
              {profile?.username || username || "Profile"}
            </div>
            <div style={styles.sub}>View profile</div>
          </div>
        </button>
      </aside>
    </div>
  );
}
