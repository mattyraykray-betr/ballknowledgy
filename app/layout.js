export const metadata = {
  title: "That Guy Rocked",
  description: "NBA player challenge",
};

import { Roboto_Slab } from "next/font/google";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export { robotoSlab };

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0 }}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#050505" }}>
        {children}
      </body>
    </html>
  );
}
