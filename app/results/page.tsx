"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from "recharts";
import { ExternalLink, Clock, ChevronDown } from "lucide-react";
import ChatBot from "@/components/analysis/ChatBot";
import RadarChart3D from "@/components/analysis/RadarChart3D";
import { getCurrentSession, archiveSession } from "@/lib/storage";
import { StudentInput, AnalysisResult, ComparisonResult, Resource } from "@/lib/types";

/* ─── helpers ─── */
const clr = (pct: number) =>
  pct >= 70 ? "#2D6A4F" : pct >= 40 ? "#C9A84C" : "#9B2335";

const section = (delay: number): object => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

type ResourceFilter = "All" | "video" | "article" | "practice" | "book";
type DifficultyFilter = "All" | "easy" | "medium" | "hard";

/* ═══════════════════════════════════════
   RESULTS PAGE
   ═══════════════════════════════════════ */
export default function ResultsPage() {
  const router = useRouter();
  const [input, setInput] = useState<StudentInput | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [resFilter, setResFilter] = useState<ResourceFilter>("All");
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>("All");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    const session = getCurrentSession();
    if (!session) {
      router.push("/analyze");
      return;
    }
    setInput(session.input);
    setResult(session.result);
    if (session.comparison) setComparison(session.comparison);
  }, [router]);

  if (!input || !result) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F2ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #E8E5DF", borderTop: "3px solid #C9A84C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const pct = input.maxScore > 0 ? Math.round((input.totalScore / input.maxScore) * 100) : 0;
  const passingPct = input.passingMarks
    ? (input.maxScore > 0 ? Math.round((input.passingMarks / input.maxScore) * 100) : 0)
    : null;

  /* chart data */
  const barData = input.topics.map((t) => {
    const p = t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0;
    return { name: t.topic, score: p, fill: clr(p) };
  });

  const radarData = input.topics.map((t) => ({
    subject: t.topic.length > 10 ? t.topic.slice(0, 10) + "…" : t.topic,
    value: t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0,
    fullMark: 100,
  }));

  const radialData = [{ name: "Score", value: pct, fill: clr(pct) }];

  /* filtered resources & questions */
  const filteredResources =
    resFilter === "All"
      ? result.studyResources
      : result.studyResources.filter((r) => r.type === resFilter);

  const filteredQuestions =
    diffFilter === "All"
      ? result.practiceQuestions
      : result.practiceQuestions.filter((q) => q.difficulty === diffFilter);

  const handleRetake = () => {
    archiveSession();
    router.push("/analyze?mode=retake");
  };

  /* ─── type badge colors ─── */
  const typeBadge = (type: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      video: { bg: "rgba(27,79,114,0.10)", color: "#1B4F72" },
      article: { bg: "rgba(45,106,79,0.10)", color: "#2D6A4F" },
      practice: { bg: "rgba(155,35,53,0.10)", color: "#9B2335" },
      book: { bg: "rgba(201,168,76,0.10)", color: "#C9A84C" },
    };
    const t = (type || "").toLowerCase();
    return map[t] || { bg: "rgba(13,13,13,0.10)", color: "#52514E" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2ED" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px 80px" }}>

        {/* ═══ COMPARISON BANNER ═══ */}
        {comparison && (
          <motion.div {...section(0)} style={{
            marginBottom: 32,
            padding: 32,
            borderRadius: 16,
            background:
              comparison.overallChange === "improved" ? "rgba(45,106,79,0.08)"
              : comparison.overallChange === "declined" ? "rgba(155,35,53,0.08)"
              : "rgba(201,168,76,0.08)",
            border: `1px solid ${
              comparison.overallChange === "improved" ? "rgba(45,106,79,0.30)"
              : comparison.overallChange === "declined" ? "rgba(155,35,53,0.20)"
              : "rgba(201,168,76,0.20)"
            }`,
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{
                fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em",
                color: comparison.overallChange === "improved" ? "#2D6A4F" : comparison.overallChange === "declined" ? "#9B2335" : "#C9A84C",
              }}>Progress Report</span>
              <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "#0D0D0D", margin: "8px 0" }}>
                {comparison.overallChange === "improved" ? "You're getting better. 🎯" : comparison.overallChange === "declined" ? "Let's recalibrate." : "Holding steady."}
              </h2>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: "#52514E", lineHeight: 1.6 }}>{comparison.progressMessage}</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { value: `${comparison.changePercentage >= 0 ? "+" : ""}${comparison.changePercentage}%`, label: "Score change", color: comparison.changePercentage >= 0 ? "#2D6A4F" : "#9B2335" },
                { value: String(comparison.improvedTopics.length), label: "Improved", color: "#2D6A4F" },
                { value: String(comparison.stillWeakTopics.length), label: "Still weak", color: "#9B2335" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", textAlign: "center", minWidth: 90 }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 600, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ ROW 1: HEADER + SCORE ═══ */}
        <motion.div {...section(0)} style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-start", marginBottom: 40 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <span style={{
              display: "inline-block", fontFamily: "'Outfit',sans-serif", fontSize: 12,
              fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
              color: "#C9A84C", background: "rgba(201,168,76,0.10)",
              borderRadius: 999, padding: "5px 14px", marginBottom: 16,
            }}>{input.subject} Analysis</span>
            <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 42, color: "#0D0D0D", lineHeight: 1.1, margin: 0 }}>
              Your learning path is ready.
            </h1>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, color: "#52514E", maxWidth: 560, marginTop: 12, lineHeight: 1.65 }}>
              {result.overallAssessment}
            </p>
          </div>

          {/* score card */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32,
            textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            minWidth: 220, flexShrink: 0,
          }}>
            <div style={{ width: 140, height: 140, margin: "0 auto" }}>
              <ResponsiveContainer>
                <RadialBarChart innerRadius="78%" outerRadius="100%" startAngle={220} endAngle={-40} data={radialData} barSize={12}>
                  <RadialBar background dataKey="value" cornerRadius={6} animationDuration={1200} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 52, fontWeight: 500, color: "#0D0D0D", marginTop: -20 }}>
              {input.totalScore}<span style={{ fontSize: 24, color: "#9E9B95" }}>/{input.maxScore}</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 500, color: clr(pct) }}>{pct}%</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#9E9B95", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Overall Score</div>
          </div>
        </motion.div>

        {/* ═══ ROW 2: STRENGTHS + WEAKNESSES ═══ */}
        <motion.div {...section(0.05)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          {/* strengths */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 32 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#2D6A4F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>✦ Where you&apos;re strong</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {result.strengths.map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2D6A4F", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 500, color: "#0D0D0D", flex: 1 }}>{s}</span>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 500, color: "#2D6A4F", background: "rgba(45,106,79,0.10)", borderRadius: 999, padding: "3px 10px" }}>Strong</span>
                </div>
              ))}
              {result.strengths.length === 0 && <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95" }}>Keep going — strengths will emerge with practice!</p>}
            </div>
          </div>

          {/* weak areas */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1.5px solid rgba(155,35,53,0.20)" }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#9B2335", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>⚠ Where to focus first</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {result.priorityOrder.map((t, i) => {
                const topicData = input.topics.find((x) => x.topic === t);
                const topicPct = topicData ? Math.round((topicData.score / topicData.maxScore) * 100) : 0;
                return (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(155,35,53,0.10)", color: "#9B2335",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 500, color: "#0D0D0D", flex: 1 }}>{t}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#9B2335" }}>{topicPct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══ ROW 3: BAR CHART ═══ */}
        <motion.div {...section(0.08)} style={{ background: "#fff", borderRadius: 16, padding: 32, marginBottom: 32 }}>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: "#0D0D0D", marginBottom: 24, marginTop: 0 }}>Topic-by-topic breakdown</h3>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 8, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,13,0.06)" />
                <XAxis dataKey="name" tick={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fill: "#52514E" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fill: "#9E9B95" }} axisLine={false} tickLine={false} unit="%" />
                {passingPct && <ReferenceLine y={passingPct} stroke="#52514E" strokeDasharray="6 4" label={{ value: "Passing", fill: "#9E9B95", fontSize: 11, fontFamily: "'Outfit',sans-serif" }} />}
                <Tooltip
                  cursor={{ fill: "rgba(201,168,76,0.06)" }}
                  contentStyle={{
                    background: "#fff", border: "1px solid #E8E5DF",
                    borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontSize: 14,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${value}%`, "Score"]}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} animationDuration={1200}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ═══ ROW 4: RADAR + REVISION ═══ */}
        <motion.div {...section(0.1)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          <RadarChart3D topics={input.topics} />

          <div style={{ background: "#fff", borderRadius: 16, padding: 32 }}>
            <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "#0D0D0D", margin: "0 0 16px" }}>Your revision strategy</h3>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: "#52514E", lineHeight: 1.7, margin: 0 }}>{result.revisionStrategy}</p>
            {input.mistakeTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                {input.mistakeTags.map((tag) => (
                  <span key={tag} style={{
                    fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
                    color: "#C9A84C", background: "rgba(201,168,76,0.10)",
                    borderRadius: 999, padding: "5px 12px",
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ ROW 5: RESOURCES ═══ */}
        <motion.div {...section(0.12)} style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: "#0D0D0D", margin: 0 }}>Recommended resources</h2>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: "#52514E", marginTop: 8, marginBottom: 24 }}>Curated specifically for your weak areas.</p>

          {/* filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {(["All", "video", "article", "practice", "book"] as ResourceFilter[]).map((f) => (
              <button key={f} onClick={() => setResFilter(f)}
                style={{
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
                  borderRadius: 999, padding: "6px 16px", cursor: "pointer",
                  border: "1px solid " + (resFilter === f ? "#C9A84C" : "rgba(13,13,13,0.10)"),
                  background: resFilter === f ? "#C9A84C" : "transparent",
                  color: resFilter === f ? "#fff" : "#52514E",
                  transition: "all 0.2s", textTransform: "capitalize",
                }}
              >{f}</button>
            ))}
          </div>

          {/* resource grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filteredResources.map((r, i) => {
              const tb = typeBadge(r.type);
              return (
                <div key={i} style={{
                  background: "#fff", borderRadius: 14, padding: 24,
                  border: "1px solid rgba(13,13,13,0.10)",
                  transition: "box-shadow 0.2s",
                }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", borderRadius: 999, padding: "3px 10px", background: tb.bg, color: tb.color }}>{r.type}</span>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 500, borderRadius: 999, padding: "3px 10px", background: "rgba(13,13,13,0.04)", color: "#52514E" }}>{r.topic}</span>
                  </div>
                  <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 600, color: "#0D0D0D", margin: 0 }}>{r.title}</h4>
                  <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#52514E", marginTop: 8, lineHeight: 1.5 }}>{r.description}</p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(r.searchQuery)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#C9A84C", textDecoration: "none", marginTop: 14 }}
                  >
                    Search on Google <ExternalLink style={{ width: 13, height: 13 }} />
                  </a>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ ROW 6: PRACTICE QUESTIONS ═══ */}
        <motion.div {...section(0.14)} style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: "#0D0D0D", margin: 0 }}>Practice questions</h2>
          <div style={{ display: "flex", gap: 8, margin: "16px 0 24px", flexWrap: "wrap" }}>
            {(["All", "easy", "medium", "hard"] as DifficultyFilter[]).map((f) => (
              <button key={f} onClick={() => setDiffFilter(f)}
                style={{
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
                  borderRadius: 999, padding: "6px 16px", cursor: "pointer",
                  border: "1px solid " + (diffFilter === f ? "#C9A84C" : "rgba(13,13,13,0.10)"),
                  background: diffFilter === f ? "#C9A84C" : "transparent",
                  color: diffFilter === f ? "#fff" : "#52514E",
                  transition: "all 0.2s", textTransform: "capitalize",
                }}
              >{f}</button>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
            {filteredQuestions.map((q, i) => {
              const isOpen = expandedQ === i;
              const diffColor = q.difficulty === "easy" ? "#2D6A4F" : q.difficulty === "medium" ? "#C9A84C" : "#9B2335";
              return (
                <div key={i} style={{ borderBottom: i < filteredQuestions.length - 1 ? "1px solid rgba(13,13,13,0.08)" : "none" }}>
                  <button
                    onClick={() => setExpandedQ(isOpen ? null : i)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "18px 24px",
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12,
                    }}
                  >
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: "#0D0D0D", flex: 1, lineHeight: 1.5 }}>{q.question}</span>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", borderRadius: 999, padding: "3px 10px", background: `${diffColor}18`, color: diffColor, flexShrink: 0 }}>{q.difficulty}</span>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 500, borderRadius: 999, padding: "3px 10px", background: "rgba(13,13,13,0.04)", color: "#52514E", flexShrink: 0 }}>{q.topic}</span>
                    <ChevronDown style={{
                      width: 16, height: 16, color: "#9E9B95", flexShrink: 0,
                      transition: "transform 0.25s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }} />
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: "0 24px 18px",
                    }}>
                      <div style={{
                        background: "rgba(201,168,76,0.05)",
                        borderLeft: "3px solid #C9A84C",
                        padding: "12px 16px",
                        borderRadius: "0 8px 8px 0",
                      }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.04em" }}>Hint</span>
                        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#52514E", margin: "4px 0 0", lineHeight: 1.5 }}>{q.hint}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredQuestions.length === 0 && (
              <p style={{ padding: 24, fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", textAlign: "center" }}>No questions match this filter.</p>
            )}
          </div>
        </motion.div>

        {/* ═══ ROW 7: WEEKLY PLAN ═══ */}
        <motion.div {...section(0.16)} style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: "#0D0D0D", margin: "0 0 24px" }}>Your 7-day study plan</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
            {result.weeklyPlan.map((day, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 14, padding: 20,
                border: "1px solid rgba(13,13,13,0.10)",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#9E9B95", textTransform: "uppercase" }}>Day {i + 1}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "#0D0D0D" }}>{day.day.replace(/Day \d+ \(|\)/g, "")}</div>
                <span style={{
                  display: "inline-block", fontFamily: "'Outfit',sans-serif", fontSize: 12,
                  color: "#C9A84C", background: "rgba(201,168,76,0.10)",
                  borderRadius: 999, padding: "3px 10px", alignSelf: "flex-start",
                }}>{day.focus}</span>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {day.tasks.map((task, j) => (
                    <li key={j} style={{
                      fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#52514E",
                      lineHeight: 1.6, display: "flex", gap: 6,
                    }}>
                      <span style={{ color: "#C9A84C", flexShrink: 0 }}>•</span>
                      {task}
                    </li>
                  ))}
                </ul>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4, marginTop: "auto",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#9E9B95",
                }}>
                  <Clock style={{ width: 13, height: 13 }} />
                  {day.estimatedTime}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══ ROW 8: MOTIVATIONAL CTA ═══ */}
        <motion.div {...section(0.18)} style={{
          background: "#0D0D0D", borderRadius: 20, padding: "64px 48px",
          textAlign: "center", marginBottom: 32,
        }}>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 38, fontStyle: "italic", color: "#F5F2ED", lineHeight: 1.2, margin: 0, maxWidth: 600, marginInline: "auto" }}>
            {result.motivationalMessage}
          </h2>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: "#9E9B95", marginTop: 16 }}>
            You&apos;re estimated to see major improvement in {result.estimatedImprovementDays} days.
          </p>
          <button
            onClick={handleRetake}
            style={{
              marginTop: 32, fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 600,
              color: "#fff", background: "#C9A84C", border: "none",
              borderRadius: 999, padding: "16px 40px", cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#A07830"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(201,168,76,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#C9A84C"; e.currentTarget.style.boxShadow = "none"; }}
          >
            Take a progress test →
          </button>
        </motion.div>
      </div>

      {/* ═══ FLOATING CHATBOT ═══ */}
      <ChatBot input={input} result={result} />
    </div>
  );
}
