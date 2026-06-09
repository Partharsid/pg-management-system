import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PG Management System",
  description: "Manage your Paying Guest accommodations efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
