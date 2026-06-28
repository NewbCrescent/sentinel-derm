import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Sentinel Derm",
  description: "Dermatologist review queue for Sentinel Derm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
