import "./globals.css";

export const metadata = {
  title: "Manchale Travelers | Curated Travel Experiences",
  description:
    "Discover curated journeys, explore remarkable destinations, and book your next unforgettable travel experience with Manchale Travelers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
