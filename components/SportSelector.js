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
    </div>
  );
}
