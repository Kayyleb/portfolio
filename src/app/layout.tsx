import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body>
        {/* Navigation Header */}
        <header className="bg-bg p-5">
          <nav className="flex gap-[15px]">
            <Link href="/">Home</Link>
            <Link href="/Projects">Projects</Link>
            <Link href="/Experience">Experience</Link>
          </nav>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-5">
          {children}
        </main>
      </body>
    </html>
  );
}
