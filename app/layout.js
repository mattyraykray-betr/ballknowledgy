import GoogleAnalytics from "../components/GoogleAnalytics";

export const metadata = {
  title: "That Guy Rocked",
  description:
    "Daily sports trivia games including Name a Dude, Ladder Golf, and Ball Knowledgy.",
  openGraph: {
    title: "That Guy Rocked",
    description:
      "Daily sports trivia games including Name a Dude, Ladder Golf, and Ball Knowledgy.",
    url: "https://www.thatguyrocked.com",
    siteName: "That Guy Rocked",
    images: [
      {
        url: "https://www.thatguyrocked.com/That-Guy-Rocked.png",
        width: 1200,
        height: 630,
        alt: "That Guy Rocked sports trivia games",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "That Guy Rocked",
    description:
      "Daily sports trivia games including Name a Dude, Ladder Golf, and Ball Knowledgy.",
    images: ["https://www.thatguyrocked.com/That-Guy-Rocked.png"],
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
