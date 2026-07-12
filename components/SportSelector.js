"use client";

export const SPORT_OPTIONS = [
  { key: "basketball-nba", label: "Pro Basketball", sport: "basketball", league: "NBA" },
  { key: "baseball-mlb", label: "Pro Baseball", sport: "baseball", league: "MLB" },
];

export function getSportOption(key) {
  const normalizedKey = String(key || "").trim().toLowerCase();
  if (["basketball", "nba", "pro basketball", "basketball-nba"].includes(normalizedKey)) return SPORT_OPTIONS[0];
  if (["baseball", "mlb", "pro baseball", "baseball-mlb"].includes(normalizedKey)) return SPORT_OPTIONS[1];
  return SPORT_OPTIONS.find((option) => option.key === key) || SPORT_OPTIONS[0];
}

export default function SportSelector({ value, onChange, theme }) {
  const selectedKey = getSportOption(value).key;

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          color: theme.muted,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.04em",
          marginBottom: 4,
          textTransform: "uppercase",
        }}
      >
        Sport
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 6,
        }}
      >
        {SPORT_OPTIONS.map((option) => {
          const active = option.key === selectedKey;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(getSportOption(option.key).key)}
              style={{
                border: `1px solid ${theme.border}`,
                borderBottom: active ? "3px solid #EF3B24" : `1px solid ${theme.border}`,
                boxShadow: active ? "inset 0 -2px 0 #EF3B24" : "none",
                background: "#111111",
                color: "#ffffff",
                borderRadius: 6,
                padding: active ? "9px 8px 7px" : "9px 8px",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {selectedKey === "baseball-mlb" && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginTop: 8,
            padding: "8px 9px",
            border: "1px solid #003594",
            borderRadius: 6,
            background: "rgba(0, 53, 148, 0.10)",
            color: theme.text,
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              padding: "2px 6px",
              borderRadius: 4,
              background: "#003594",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 950,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Beta
          </span>
          <span>
            Pro Baseball game mode is in beta testing. If you notice any missing players or issues,{" "}
            <a
              href="mailto:thatguyrocked@gmail.com?subject=Pro%20Baseball%20Beta%20Feedback"
              style={{ color: "#2F80ED", fontWeight: 900 }}
            >
              let us know
            </a>
            !
          </span>
        </div>
      )}
    </div>
  );
}
