export const metadata = {
  title: "Ball Knowledgy",
  description: "Daily NBA player trivia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
