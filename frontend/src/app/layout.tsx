import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "GrowEasy | AI CSV Lead Importer",
  description: "Upload any CSV and let AI map it into GrowEasy CRM leads.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
