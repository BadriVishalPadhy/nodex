import type { Metadata } from "next";
import { GeistPixelSquare } from "geist/font/pixel";

import './globals.css'

export const metadata: Metadata = {
  title: "nodex — Workflow Automation",
  description: "Build powerful workflow automations visually. Connect triggers and actions without writing code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistPixelSquare.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
