"use client";

export const SPORT_OPTIONS = [
  { key: "basketball-nba", label: "Pro Basketball", sport: "basketball", league: "NBA" },
  { key: "baseball-mlb", label: "Pro Baseball", sport: "baseball", league: "MLB" },
];

export function getSportOption(key) {
  return SPORT_OPTIONS.find((option) => option.key === key) || SPORT_OPTIONS[0];
}

export default function SportSelector({ value, onChange, theme }) {
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
          const active = option.key === value;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              style={{
                border: active ? "1px solid #EF3B24" : `1px solid ${theme.border}`,
                background: active ? "#EF3B24" : theme.input,
                color: active ? "#ffffff" : theme.text,
                borderRadius: 6,
                padding: "9px 8px",
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
