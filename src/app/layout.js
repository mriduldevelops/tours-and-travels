import "./globals.css";

export const metadata = {
  title: "Wanderlust | Premium Tour & Travel",
  description:
    "Discover luxury tour packages, explore destinations, and book your next unforgettable travel experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
