export const metadata = {
  title: "That Guy Rocked",
  description: "NBA player challenge",
};

export const metadata = {
  verification: {
    google: "google-site-verification=a83O1jh1jE-3mrmmIzlVa8VIqNSt00nZQf3gHUYEJoI",
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
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;800;900&amp;display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#050505" }}>
        {children}
      </body>
    </html>
  );
}
