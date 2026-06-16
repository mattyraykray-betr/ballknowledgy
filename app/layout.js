import GoogleAnalytics from "../components/GoogleAnalytics";

export const metadata = {
  title: "That Guy Rocked",
  description:
    "Daily basketball trivia games including Name a Dude, Ladder Golf, and Ball Knowledgy.",
  openGraph: {
    title: "That Guy Rocked",
    description:
      "Daily basketball trivia games including Name a Dude, Ladder Golf, and Ball Knowledgy.",
    url: "https://www.thatguyrocked.com",
    siteName: "That Guy Rocked",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0 }}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#050505" }}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
