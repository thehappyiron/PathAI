"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Brain, Route, RefreshCw } from "lucide-react";
import HeroProgressTracker from "@/components/analysis/HeroProgressTracker";

/* ─────────────── animation variants ─────────────── */
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/* ─────────────── mock score-card data ─────────────── */
const mockTopics = [
  { name: "Algebra", score: 82, color: "#2D6A4F" },
  { name: "Geometry", score: 45, color: "#9B2335" },
  { name: "Calculus", score: 61, color: "#C9A84C" },
];

/* ═══════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter();

  const goAnalyze = () => router.push("/analyze");

  return (
    <div style={{ backgroundColor: "#F5F2ED" }}>
      {/* ░░░░░░░░░░░░░░  SECTION 2 — HERO  ░░░░░░░░░░░░░░ */}
      <section
        className="flex items-center"
        style={{ minHeight: "92vh", paddingTop: "64px" }}
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-20 items-center">
            {/* ── LEFT COLUMN (60 %) ── */}
            <motion.div
              className="lg:col-span-3"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {/* pill badge */}
              <motion.div variants={fadeUp}>
                <span
                  className="inline-flex items-center gap-1.5 font-body uppercase select-none"
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.12em",
                    color: "var(--ink-muted)",
                    background: "#F0EBE0",
                    border: "1px solid var(--border)",
                    borderRadius: "999px",
                    padding: "6px 16px",
                  }}
                >
                  ✦ AI-Powered Learning
                </span>
              </motion.div>

              {/* headline */}
              <motion.h1
                variants={fadeUp}
                className="font-display"
                style={{
                  fontSize: "clamp(42px, 6vw, 72px)",
                  lineHeight: 1.05,
                  color: "var(--ink)",
                  marginTop: "28px",
                }}
              >
                Study smarter,
                <br />
                <em>not harder.</em>
              </motion.h1>

              {/* subheadline */}
              <motion.p
                variants={fadeUp}
                className="font-body"
                style={{
                  fontSize: "20px",
                  color: "var(--ink-muted)",
                  maxWidth: "480px",
                  marginTop: "24px",
                  lineHeight: 1.55,
                }}
              >
                PathAI identifies exactly where you struggle and builds a
                personalized roadmap&nbsp;— updated every time you test
                yourself.
              </motion.p>

              {/* CTA row */}
              <motion.div
                variants={fadeUp}
                className="flex items-center flex-wrap gap-y-4"
                style={{ marginTop: "48px", gap: "12px" }}
              >
                <button
                  onClick={goAnalyze}
                  className="font-body font-semibold text-white rounded-pill cursor-pointer hover:shadow-gold transition-all duration-300"
                  style={{
                    fontSize: "16px",
                    padding: "16px 36px",
                    background: "var(--accent-gold)",
                    border: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--accent-gold-dark)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--accent-gold)")
                  }
                >
                  Analyze My Performance →
                </button>

                <button
                  onClick={() => router.push("/learn")}
                  className="font-body font-semibold rounded-pill cursor-pointer transition-all duration-300"
                  style={{
                    fontSize: "16px",
                    padding: "16px 36px",
                    background: "#0D0D0D",
                    color: "#F5F2ED",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1a1a1a";
                    e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#0D0D0D";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  📚 Learn →
                </button>

                <a
                  href="#features"
                  className="font-body transition-colors duration-200"
                  style={{
                    fontSize: "15px",
                    color: "var(--ink-muted)",
                    marginLeft: "12px",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  See how it works ↓
                </a>
              </motion.div>

              {/* scan CTA */}
              <motion.div variants={fadeUp} style={{ marginTop: 16 }}>
                <span
                  className="font-body"
                  style={{ fontSize: "14px", color: "var(--ink-faint)" }}
                >
                  or
                </span>{" "}
                <a
                  href="/scan"
                  className="font-body"
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "var(--accent-gold)",
                    textDecoration: "none",
                    transition: "text-decoration 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  📸 Scan marksheet instantly
                </a>
              </motion.div>
            </motion.div>

            {/* ── RIGHT COLUMN — interactive tracker (desktop) ── */}
            <motion.div
              className="lg:col-span-2 w-full mt-10 lg:mt-0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
            >
              <HeroProgressTracker />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ░░░░░░░░░░░░░░  SECTION 3 — FEATURES  ░░░░░░░░░░░░░░ */}
      <section
        id="features"
        style={{
          paddingTop: "96px",
          paddingBottom: "96px",
          backgroundColor: "#F5F2ED",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* heading */}
          <motion.div
            className="text-center"
            style={{ marginBottom: "64px" }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(30px, 4vw, 42px)",
                color: "var(--ink)",
                lineHeight: 1.15,
              }}
            >
              Everything you need to catch up&nbsp;— fast.
            </h2>
            <p
              className="font-body"
              style={{
                fontSize: "18px",
                color: "var(--ink-muted)",
                marginTop: "16px",
                lineHeight: 1.55,
              }}
            >
              No more guessing what to study. PathAI does the thinking.
            </p>
          </motion.div>

          {/* 3-card grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Brain,
                iconBg: "rgba(45,106,79,0.10)",
                iconColor: "#2D6A4F",
                title: "Pinpoints your gaps",
                body: "Analyzes every topic and question to find exactly where you're losing marks — not just what you got wrong, but why.",
              },
              {
                Icon: Route,
                iconBg: "rgba(201,168,76,0.10)",
                iconColor: "#C9A84C",
                title: "Builds your learning path",
                body: "Generates a day-by-day study plan with specific resources, practice questions ranked by difficulty, and revision strategies.",
              },
              {
                Icon: RefreshCw,
                iconBg: "rgba(27,79,114,0.10)",
                iconColor: "#1B4F72",
                title: "Adapts as you improve",
                body: "Take a re-test anytime. PathAI compares your new scores to your old ones and updates your entire plan in seconds.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "40px",
                  border: "1px solid #E8E5DF",
                }}
              >
                {/* icon */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    background: card.iconBg,
                    marginBottom: "24px",
                  }}
                >
                  <card.Icon
                    style={{ width: 24, height: 24, color: card.iconColor }}
                  />
                </div>
                <h3
                  className="font-body"
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--ink)",
                    marginBottom: "12px",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  className="font-body"
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.6,
                    color: "var(--ink-muted)",
                  }}
                >
                  {card.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░░░░░░░░░░░░  SECTION 4 — SOCIAL PROOF BAR  ░░░░░░░░░░░░░░ */}
      <section style={{ background: "#0D0D0D", padding: "28px 0" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p
            className="font-body"
            style={{ fontSize: "15px", color: "#9E9B95", marginBottom: "14px" }}
          >
            Built for students. Trusted by toppers.
          </p>
          <div
            className="flex items-center justify-center flex-wrap gap-y-2"
            style={{ gap: "0 32px" }}
          >
            {["2 min setup", "Personalized to your syllabus", "Updates automatically"].map(
              (stat, i, arr) => (
                <React.Fragment key={stat}>
                  <span
                    className="font-body"
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#FAFAF8",
                    }}
                  >
                    {stat}
                  </span>
                  {i < arr.length - 1 && (
                    <span
                      style={{
                        color: "#333",
                        fontSize: "15px",
                        userSelect: "none",
                      }}
                    >
                      ·
                    </span>
                  )}
                </React.Fragment>
              )
            )}
          </div>
        </div>
      </section>

      {/* ░░░░░░░░░░░░░░  SECTION 5 — FINAL CTA  ░░░░░░░░░░░░░░ */}
      <section
        style={{
          paddingTop: "96px",
          paddingBottom: "96px",
          backgroundColor: "#F5F2ED",
        }}
      >
        <motion.div
          className="max-w-7xl mx-auto px-6 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              fontStyle: "italic",
              color: "var(--ink)",
              lineHeight: 1.1,
            }}
          >
            Ready to stop guessing?
          </h2>

          <div style={{ marginTop: "40px" }}>
            <button
              onClick={goAnalyze}
              className="font-body font-semibold text-white rounded-pill cursor-pointer hover:shadow-gold transition-all duration-300"
              style={{
                fontSize: "18px",
                padding: "18px 44px",
                background: "var(--accent-gold)",
                border: "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--accent-gold-dark)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--accent-gold)")
              }
            >
              Start your analysis →
            </button>
          </div>

          <p
            className="font-body"
            style={{
              fontSize: "14px",
              color: "var(--ink-faint)",
              marginTop: "16px",
            }}
          >
            Free. No login required.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
