import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PWD Forest Proposals Management",
  description: "Advanced tracking and management system for PWD forest and wildlife proposals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen selection:bg-indigo-500/30`}>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(15,23,42,0.5))] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
