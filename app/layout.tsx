import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import AuthButton from "@/components/auth/AuthButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathAI — AI-Powered Exam Preparation Intelligence",
  description:
    "Analyze your academic strengths and weaknesses with AI. Get personalized study plans, practice questions, and expert recommendations for exam success.",
  keywords: ["AI exam prep", "study planner", "academic analysis", "learning intelligence"],
  openGraph: {
    title: "PathAI — Exam Preparation Intelligence",
    description: "AI-powered academic analysis for smarter exam preparation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body bg-surface text-ink antialiased">
        <AuthProvider>
          {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md" style={{ background: 'rgba(245,242,237,0.85)' }}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: '64px' }}>
            <a href="/" className="flex items-center gap-2">
              <span className="font-display text-ink cursor-target" style={{ fontSize: '22px' }}>PathAI</span>
            </a>
            <AuthButton />
          </div>
        </nav>

        {/* Main content */}
        <main className="pt-16 min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#E8E5DF] bg-surface-raised">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#C9A84C] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <span className="font-display text-lg text-ink">PathAI</span>
              </div>
              <p className="text-sm text-ink-faint font-body">
                © {new Date().getFullYear()} PathAI. Intelligent exam preparation.
              </p>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
