"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Lock, TrendingUp, TrendingDown, Minus, Clock, CalendarDays, Activity, ChevronRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "@/lib/AuthContext";
import { getCloudHistory, getCloudActivity, ActivityPayload } from "@/lib/firebase_service";
import { SessionPayload } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─── */
type MainTab = "marks" | "engagement";
type TimePeriod = "day" | "week" | "month";

interface ScoreEntry {
  index: number;
  label: string;
  date: string;
  score: number;
  max: number;
  pct: number;
  subject: string;
  change: number | null; // % change from previous
}

/* ─── Helpers ─── */
const clr = (pct: number) => pct >= 70 ? "#2D6A4F" : pct >= 40 ? "#C9A84C" : "#9B2335";
const changeBg = (c: number) => c > 0 ? "rgba(45,106,79,0.10)" : c < 0 ? "rgba(155,35,53,0.10)" : "rgba(158,155,149,0.10)";
const changeColor = (c: number) => c > 0 ? "#2D6A4F" : c < 0 ? "#9B2335" : "#9E9B95";

function isWithinPeriod(timestamp: number, period: TimePeriod): boolean {
  const now = new Date();
  const d = new Date(timestamp);
  if (period === "day") {
    return d.toDateString() === now.toDateString();
  }
  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }
  // month
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  return d >= monthAgo;
}

export default function HeroProgressTracker() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTab>("marks");
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [history, setHistory] = useState<SessionPayload[]>([]);
  const [activity, setActivity] = useState<ActivityPayload[]>([]);
  const [selectedMaxScore, setSelectedMaxScore] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        getCloudHistory(user.uid, 100),
        getCloudActivity(user.uid, 30)
      ]).then(([histData, actData]) => {
        setHistory(histData);
        setActivity(actData);
      });
    }
  }, [user]);

  /* ─── Distinct max-score scales ─── */
  const maxScoreScales = useMemo(() => {
    return Array.from(new Set(history.map(s => s.input?.maxScore).filter(Boolean))).sort((a, b) => a - b);
  }, [history]);

  useEffect(() => {
    if (maxScoreScales.length > 0 && selectedMaxScore === null) {
      setSelectedMaxScore(maxScoreScales[maxScoreScales.length - 1]);
    }
  }, [maxScoreScales, selectedMaxScore]);

  /* ─── Filtered + shaped score entries ─── */
  const scoreEntries: ScoreEntry[] = useMemo(() => {
    if (!selectedMaxScore) return [];
    const filtered = history
      .filter(s => s.input?.maxScore === selectedMaxScore)
      .filter(s => isWithinPeriod(s.timestamp || Date.now(), period));

    return filtered.map((s, i) => {
      const pct = s.input.maxScore > 0 ? Math.round((s.input.totalScore / s.input.maxScore) * 100) : 0;
      const prevPct = i > 0 ? (() => {
        const prev = filtered[i - 1];
        return prev.input.maxScore > 0 ? Math.round((prev.input.totalScore / prev.input.maxScore) * 100) : 0;
      })() : null;
      const change = prevPct !== null ? pct - prevPct : null;

      const d = new Date(s.timestamp || Date.now());
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

      return {
        index: i + 1,
        label: `Test ${i + 1}`,
        date: dateStr,
        score: s.input.totalScore,
        max: s.input.maxScore,
        pct,
        subject: s.input.subject,
        change,
      };
    });
  }, [history, selectedMaxScore, period]);

  /* ─── Engagement data ─── */
  const filteredActivity = useMemo(() => {
    return activity.filter(a => {
      const d = new Date(a.date + "T00:00:00");
      return isWithinPeriod(d.getTime(), period);
    });
  }, [activity, period]);

  const totalMins = filteredActivity.reduce((acc, a) => acc + (a.totalMinutes || 0), 0);
  const avgMins = filteredActivity.length > 0 ? Math.round(totalMins / filteredActivity.length) : 0;

  /* ─── Locked state ─── */
  if (!user) {
    return (
      <div style={{
        position: "relative", width: "100%", background: "#fff", borderRadius: 20,
        border: "1px solid rgba(13,13,13,0.08)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        padding: 48, overflow: "hidden", minHeight: 380,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, filter: "blur(6px)", pointerEvents: "none" }}>
          <svg width="100%" height="80%" viewBox="0 0 400 200" preserveAspectRatio="none" style={{ position: "absolute", bottom: 0 }}>
            <path d="M0,150 Q100,50 200,100 T400,20 L400,200 L0,200 Z" fill="#2D6A4F" />
          </svg>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 340 }}>
          <div style={{
            width: 56, height: 56, background: "#FAFAF8", border: "1px solid rgba(13,13,13,0.08)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)", marginBottom: 16, color: "#C9A84C",
          }}>
            <Lock size={24} />
          </div>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 20, color: "#0D0D0D", margin: "0 0 8px" }}>Unlock Your Insights</h3>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", margin: 0, lineHeight: 1.6 }}>
            Log in to view real-time learning progress, score history, and daily engagement habits.
          </p>
        </div>
      </div>
    );
  }

  /* ─── Period pill component ─── */
  const PeriodPills = () => (
    <div style={{ display: "flex", background: "#F5F2ED", padding: 3, borderRadius: 999, border: "1px solid rgba(13,13,13,0.06)" }}>
      {(["day", "week", "month"] as TimePeriod[]).map(p => (
        <button key={p} onClick={() => setPeriod(p)} style={{
          fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600,
          padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer",
          background: period === p ? "#fff" : "transparent",
          color: period === p ? "#0D0D0D" : "#9E9B95",
          boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
          transition: "all 0.2s", textTransform: "capitalize",
        }}>
          {p === "day" ? "Today" : p === "week" ? "This Week" : "This Month"}
        </button>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: "#fff", borderRadius: 20,
        border: "1px solid rgba(13,13,13,0.08)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        overflow: "hidden", display: "flex", flexDirection: "column",
        width: "100%", minHeight: 380,
      }}
    >
      {/* ── Header + Tabs ── */}
      <div style={{
        padding: "20px 24px", borderBottom: "1px solid rgba(13,13,13,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, background: "#FAFAF8",
      }}>
        <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 18, color: "#0D0D0D", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={18} color="#C9A84C" /> Progress Dashboard
        </h3>

        <div style={{ display: "flex", background: "#F5F2ED", padding: 3, borderRadius: 999, border: "1px solid rgba(13,13,13,0.06)" }}>
          <button onClick={() => setActiveTab("marks")} style={{
            fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
            padding: "6px 16px", borderRadius: 999, border: "none", cursor: "pointer",
            background: activeTab === "marks" ? "#fff" : "transparent",
            color: activeTab === "marks" ? "#0D0D0D" : "#9E9B95",
            boxShadow: activeTab === "marks" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.2s",
          }}>Scores</button>
          <button onClick={() => setActiveTab("engagement")} style={{
            fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
            padding: "6px 16px", borderRadius: 999, border: "none", cursor: "pointer",
            background: activeTab === "engagement" ? "#fff" : "transparent",
            color: activeTab === "engagement" ? "#0D0D0D" : "#9E9B95",
            boxShadow: activeTab === "engagement" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.2s",
          }}>Engagement</button>
        </div>
      </div>

      <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ═══════════════════════════════════
            SCORES TAB — Horizontal Growth
           ═══════════════════════════════════ */}
        {activeTab === "marks" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Top row: title + filters */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: "#0D0D0D", margin: 0 }}>Score History</h4>
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95", margin: "4px 0 0" }}>
                  Horizontal growth tracker — see your trajectory.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <PeriodPills />
                {maxScoreScales.length > 0 && (
                  <select
                    value={selectedMaxScore || ""}
                    onChange={e => setSelectedMaxScore(Number(e.target.value))}
                    style={{
                      fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
                      background: "#FAFAF8", border: "1px solid rgba(13,13,13,0.10)",
                      borderRadius: 10, padding: "6px 12px", color: "#0D0D0D",
                      cursor: "pointer", outline: "none",
                    }}
                  >
                    {maxScoreScales.map(scale => (
                      <option key={scale} value={scale}>Out of {scale}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* ── Growth Timeline ── */}
            {scoreEntries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
                
                {/* Overall trend summary */}
                {scoreEntries.length >= 2 && (() => {
                  const first = scoreEntries[0].pct;
                  const last = scoreEntries[scoreEntries.length - 1].pct;
                  const totalChange = last - first;
                  return (
                    <div style={{
                      display: "flex", gap: 16, marginBottom: 20, padding: "14px 18px",
                      background: totalChange >= 0 ? "rgba(45,106,79,0.05)" : "rgba(155,35,53,0.05)",
                      border: `1px solid ${totalChange >= 0 ? "rgba(45,106,79,0.15)" : "rgba(155,35,53,0.15)"}`,
                      borderRadius: 14, alignItems: "center",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: totalChange >= 0 ? "rgba(45,106,79,0.12)" : "rgba(155,35,53,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {totalChange > 0 ? <TrendingUp size={20} color="#2D6A4F" /> : totalChange < 0 ? <TrendingDown size={20} color="#9B2335" /> : <Minus size={18} color="#9E9B95" />}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: changeColor(totalChange) }}>
                          {totalChange > 0 ? "+" : ""}{totalChange}% overall change
                        </div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95" }}>
                          across {scoreEntries.length} tests • {scoreEntries[0].date} → {scoreEntries[scoreEntries.length - 1].date}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Horizontal bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 260, paddingRight: 4 }}>
                  <AnimatePresence>
                    {scoreEntries.map((entry, i) => (
                      <motion.div
                        key={`score-${entry.index}-${entry.date}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                          background: "#FAFAF8", borderRadius: 14,
                          border: "1px solid rgba(13,13,13,0.05)",
                          transition: "box-shadow 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                      >
                        {/* Index */}
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: `${clr(entry.pct)}12`, color: clr(entry.pct),
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {entry.index}
                        </div>

                        {/* Info + Bar */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Top row: subject + date */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: "#0D0D0D" }}>
                              {entry.subject}
                            </span>
                            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9E9B95" }}>
                              {entry.date}
                            </span>
                          </div>

                          {/* Horizontal bar */}
                          <div style={{ position: "relative", height: 8, background: "rgba(13,13,13,0.06)", borderRadius: 999, overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${entry.pct}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                              style={{
                                height: "100%", borderRadius: 999,
                                background: `linear-gradient(90deg, ${clr(entry.pct)}CC, ${clr(entry.pct)})`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 60 }}>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 600, color: "#0D0D0D" }}>
                            {entry.score}<span style={{ fontSize: 11, color: "#9E9B95" }}>/{entry.max}</span>
                          </div>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, color: clr(entry.pct) }}>
                            {entry.pct}%
                          </div>
                        </div>

                        {/* Change badge */}
                        <div style={{ flexShrink: 0, minWidth: 52 }}>
                          {entry.change !== null ? (
                            <div style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              padding: "3px 8px", borderRadius: 999,
                              background: changeBg(entry.change), 
                              fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600,
                              color: changeColor(entry.change),
                            }}>
                              {entry.change > 0 ? <TrendingUp size={11} /> : entry.change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                              {entry.change > 0 ? "+" : ""}{entry.change}%
                            </div>
                          ) : (
                            <div style={{
                              padding: "3px 8px", borderRadius: 999,
                              background: "rgba(201,168,76,0.10)",
                              fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 600,
                              color: "#C9A84C", textTransform: "uppercase",
                            }}>
                              First
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 32 }}>
                <TrendingUp size={32} color="#9E9B95" style={{ opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", margin: 0 }}>
                  No tests recorded for this period.
                </p>
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#C9A84C", margin: "8px 0 0" }}>
                  Run an analysis to start tracking progress!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════
            ENGAGEMENT TAB
           ═══════════════════════════════════ */}
        {activeTab === "engagement" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: "#0D0D0D", margin: 0 }}>Active Learning</h4>
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95", margin: "4px 0 0" }}>
                  Minutes spent studying per day.
                </p>
              </div>
              <PeriodPills />
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{
                flex: 1, background: "rgba(45,106,79,0.05)", border: "1px solid rgba(45,106,79,0.12)",
                borderRadius: 14, padding: "14px 18px", textAlign: "center",
              }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 600, color: "#2D6A4F" }}>{totalMins}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9E9B95", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>Total Min</div>
              </div>
              <div style={{
                flex: 1, background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: 14, padding: "14px 18px", textAlign: "center",
              }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 600, color: "#C9A84C" }}>{avgMins}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9E9B95", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>Avg/Day</div>
              </div>
              <div style={{
                flex: 1, background: "rgba(27,79,114,0.05)", border: "1px solid rgba(27,79,114,0.12)",
                borderRadius: 14, padding: "14px 18px", textAlign: "center",
              }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 600, color: "#1B4F72" }}>{filteredActivity.length}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9E9B95", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>Active Days</div>
              </div>
            </div>

            {/* Chart */}
            {filteredActivity.length > 0 ? (
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMins2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(13,13,13,0.06)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fill: "#9E9B95" }}
                      tickFormatter={(str) => {
                        const parts = str.split("-");
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                        return str;
                      }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fill: "#9E9B95" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div style={{
                              background: "#fff", border: "1px solid rgba(13,13,13,0.08)",
                              borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                              padding: 12,
                            }}>
                              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95", margin: "0 0 4px" }}>{d.date}</p>
                              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: "#0D0D0D", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={14} color="#C9A84C" />
                                <span style={{ color: "#C9A84C" }}>{d.totalMinutes}</span> Minutes
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalMinutes"
                      stroke="#C9A84C"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorMins2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 32 }}>
                <CalendarDays size={32} color="#9E9B95" style={{ opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", margin: 0 }}>
                  No study time recorded for this period.
                </p>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
