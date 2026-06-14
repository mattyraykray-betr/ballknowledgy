"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function generateRecoveryKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function part(length) {
    let value = "";
    for (let i = 0; i < length; i++) {
      value += chars[Math.floor(Math.random() * chars.length)];
    }
    return value;
  }

  return `TGR-${part(4)}-${part(4)}`;
}

export default function ProfileModal({
  show,
  onClose,
  user,
  setUser,
  darkMode,
  theme,
}) {
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [recoverUsername, setRecoverUsername] = useState("");
  const [recoverKey, setRecoverKey] = useState("");  

  if (!show) return null;

  async function uploadAvatarForUser(userId) {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function recoverProfile() {
    setAuthMessage("");
  
    if (!recoverUsername.trim() || !recoverKey.trim()) {
      setAuthMessage("Enter your username and recovery key.");
      return;
    }
  
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username, recovery_key")
      .eq("username", recoverUsername.trim())
      .eq("recovery_key", recoverKey.trim().toUpperCase())
      .maybeSingle();
  
    if (error || !profile) {
      setAuthMessage("Profile not found. Check your username and recovery key.");
      return;
    }
  
    setAuthMessage(
      "Profile found. Next step is linking this device to the recovered profile."
    );
  }

  async function loadProfile() {
    if (!user) return;
  
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, recovery_key")
      .eq("id", user.id)
      .maybeSingle();
  
    if (!data) return;
  
    setUsername(data.username || "");
    setRecoveryKey(data.recovery_key || "");
  }
  import { useEffect, useState } from "react";
  useEffect(() => {
    if (show && user) {
      loadProfile();
    }
  }, [show, user]);  
  
  
  async function continueAsGuest() {
    setAuthMessage("");
  
    const { data, error } = await supabase.auth.signInAnonymously();
  
    if (error) {
      setAuthMessage(error.message);
      return;
    }
  
    const newUser = data.user;
    setUser(newUser);
  
    const saved = await saveProfileForUser(newUser);
  
    if (saved) {
      setAuthMessage("Profile saved. Save your recovery key somewhere safe.");
    }
  }

  async function saveProfileForUser(profileUser = user) {
    if (!profileUser) return false;
  
    try {
      const uploadedAvatarUrl = await uploadAvatarForUser(profileUser.id);
  
      const profileUsername =
        username.trim() || `guest_${profileUser.id.slice(0, 6)}`;

      const finalRecoveryKey = recoveryKey || generateRecoveryKey();
      
      const payload = {
        id: profileUser.id,
        username: profileUsername,
        display_name: profileUsername,
        updated_at: new Date().toISOString(),
        recovery_key: finalRecoveryKey,
        recovery_enabled: true,        
      };
  
      if (uploadedAvatarUrl) {
        payload.avatar_url = uploadedAvatarUrl;
      }
  
      const { error } = await supabase.from("profiles").upsert(payload);
  
      if (error) {
        if (error.code === "23505") {
          setAuthMessage("Username already taken, please try another username!");
        } else {
          setAuthMessage(error.message);
        }
      
        return false;
      }
  
      setRecoveryKey(finalRecoveryKey);
      setAuthMessage("Profile saved. Save your recovery key somewhere safe.");
      return true;
    } catch (err) {
      setAuthMessage(err.message || "Could not save profile.");
      return false;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setAuthMessage("");
    onClose();
  }

  const styles = {
    modalBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.72)",
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
    },
    modalCard: {
      width: "100%",
      maxWidth: 520,
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
      fontFamily: "'Roboto Slab', Rockwell, serif",
    },
    sub: {
      color: theme.muted,
      fontSize: 12,
      marginBottom: 10,
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
      marginBottom: 8,
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
      marginTop: 6,
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
    message: {
      fontWeight: 900,
      color: "#EF3B24",
      marginTop: 8,
      fontSize: 13,
    },
    recoveryBox: {
      border: `1px solid ${theme.border}`,
      background: theme.input,
      borderRadius: 8,
      padding: 10,
      marginTop: 10,
    },
    
    recoveryKey: {
      fontFamily: "monospace",
      fontSize: 18,
      fontWeight: 900,
      letterSpacing: "0.04em",
      marginBottom: 6,
    },    
  };

  return (
    <div style={styles.modalBackdrop}>
      <section style={styles.modalCard}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.label}>Profile</div>
            <div style={styles.big}>{user ? "Your Account" : "Save Scores"}</div>
          </div>

          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={styles.sub}>
          {user
            ? user.is_anonymous
              ? "Guest account"
              : user.email
            : "No email required. Create a guest profile to save scores on this device."}
        </div>

        <input
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />

        <input
          style={styles.input}
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
        />

        {user ? (
          <>
            <button
              style={styles.primaryButton}
              onClick={async () => {
                await saveProfileForUser(user);
              }}
            >
              Save Profile
            </button>

            <button style={styles.dangerButton} onClick={signOut}>
              Sign Out
            </button>
          </>
        ) : (
          <button style={styles.primaryButton} onClick={continueAsGuest}>
            Save Profile
          </button>
        )}
        <div style={{ marginTop: 14 }}>
          <div style={styles.label}>Recover Profile</div>
        
          <input
            style={styles.input}
            value={recoverUsername}
            onChange={(e) => setRecoverUsername(e.target.value)}
            placeholder="Username"
          />
        
          <input
            style={styles.input}
            value={recoverKey}
            onChange={(e) => setRecoverKey(e.target.value)}
            placeholder="Recovery Key"
          />
        
          <button style={styles.primaryButton} onClick={recoverProfile}>
            Recover Profile
          </button>
        </div>          

        {authMessage && <div style={styles.message}>{authMessage}</div>}
        {recoveryKey && (
          <div style={styles.recoveryBox}>
            <div style={styles.label}>Recovery Key</div>
            <div style={styles.recoveryKey}>{recoveryKey}</div>
            <div style={styles.sub}>
              Save this key. You will need it to use this profile on another device.
            </div>
          </div>
        )}         
      </section>
    </div>
  );
}
