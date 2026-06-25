import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kayleb Cook",
  description: "Software Engineer Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        {/* Navigation Header */}
        <header style={{ padding: '20px', background: '#F2F1EC'}}>
          <nav style={{ display: 'flex', gap: '15px' }}>
            <Link href="/">Home</Link>
            <Link href="/Projects">Projects</Link>
          </nav>
        </header>

        {/* Dynamic Page Content */}
        <main style={{ padding: '20px' }}>
          {children}
        </main>
       
       </body>
    </html>
  );
}
