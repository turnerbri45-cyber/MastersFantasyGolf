import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import AugustaBg from "@/components/layout/AugustaBg";

export const metadata: Metadata = {
  title: "Fantasy Golf — The Masters 2026",
  description: "Pick your Masters team and compete with friends",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AugustaBg />
          <div className="relative z-10 min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="text-center py-6 text-sm border-t border-masters-yellow/10"
              style={{ color: "rgba(212,175,55,0.4)" }}>
              The Masters Tournament · Augusta National Golf Club · April 9–12, 2026
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
