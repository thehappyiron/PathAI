"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { subjects } from "@/data/subjects";
import { analyzePerformance, comparePerformance } from "@/lib/gemini";
import { saveSession, getPreviousSession } from "@/lib/storage";
import { saveSessionToCloud } from "@/lib/firebase_service";
import { StudentInput, TopicScore, SessionPayload } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import TargetCursor from "@/components/ui/TargetCursor";

/* ───────── constants ───────── */
const MISTAKE_TAGS = [
  "Concept gaps",
  "Time management",
  "Silly errors",
  "Formula forgetting",
  "Application issues",
  "Fear/anxiety",
];
const HOUR_OPTIONS = ["1h", "2h", "3h", "4h+"];

const LOADING_MSGS = [
  "Identifying your weak spots...",
  "Building your personalized path...",
  "Finding the best resources for you...",
  "Almost ready...",
];

/* ───────── helpers ───────── */
function scoreColor(pct: number): string {
  if (pct >= 70) return "#2D6A4F";
  if (pct >= 40) return "#C9A84C";
  return "#9B2335";
}

/* Inner component that uses useSearchParams */
function AnalyzeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRetake = searchParams.get("mode") === "retake";
  const { user } = useAuth();

  /* previous session for retake */
  const prevSession = isRetake ? getPreviousSession() : null;
  const prevInput = prevSession?.input ?? null;

  /* ── shared state ── */
  const [step, setStep] = useState(1);

  /* step 1 */
  const [selectedSubject, setSelectedSubject] = useState(
    isRetake && prevInput ? prevInput.subject : ""
  );
  const [customSubject, setCustomSubject] = useState("");

  /* step 2 */
  const [yourScore, setYourScore] = useState("");
  const [outOf, setOutOf] = useState(
    isRetake && prevInput ? String(prevInput.maxScore) : ""
  );
  const [passingMarks, setPassingMarks] = useState(
    isRetake && prevInput?.passingMarks ? String(prevInput.passingMarks) : ""
  );

  /* step 3 */
  const [topicScores, setTopicScores] = useState<Record<string, number>>({});
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [newTopicName, setNewTopicName] = useState("");

  /* step 4 */
  const [mistakesText, setMistakesText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [studyHours, setStudyHours] = useState("2h");

  /* loading + error */
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState("");

  /* ── derived ── */
  const activeSubject = selectedSubject || customSubject;
  const subjectData = subjects.find((s) => s.name === activeSubject);
  const allTopics = [...(subjectData?.topics ?? []), ...customTopics];

  const pct =
    yourScore && outOf && Number(outOf) > 0
      ? Math.round((Number(yourScore) / Number(outOf)) * 100)
      : null;

  /* ── initialise topic scores when subject changes ── */
  useEffect(() => {
    if (subjectData) {
      const init: Record<string, number> = {};
      subjectData.topics.forEach((t) => {
        init[t] = topicScores[t] ?? 50;
      });
      setTopicScores((prev) => ({ ...init, ...prev }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject]);

  /* ── loading message cycle ── */
  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(
      () => setLoadingMsgIdx((i) => (i + 1) % LOADING_MSGS.length),
      1500
    );
    return () => clearInterval(id);
  }, [isLoading]);

  /* ── topic slider handler ── */
  const setTopicScore = useCallback((topic: string, val: number) => {
    setTopicScores((prev) => ({ ...prev, [topic]: val }));
  }, []);

  /* ── add custom topic ── */
  const addCustomTopic = () => {
    const name = newTopicName.trim();
    if (!name || allTopics.includes(name)) return;
    setCustomTopics((prev) => [...prev, name]);
    setTopicScores((prev) => ({ ...prev, [name]: 50 }));
    setNewTopicName("");
  };

  const removeCustomTopic = (name: string) => {
    setCustomTopics((prev) => prev.filter((t) => t !== name));
    setTopicScores((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  /* ── build StudentInput from form ── */
  const buildInput = (): StudentInput => {
    const maxMark = Number(outOf) || 100;
    const topicsArr: TopicScore[] = allTopics.map((t) => ({
      topic: t,
      score: Math.round(((topicScores[t] ?? 50) / 100) * maxMark),
      maxScore: maxMark,
    }));

    return {
      subject: activeSubject,
      totalScore: Number(yourScore) || 0,
      maxScore: maxMark,
      passingMarks: passingMarks ? Number(passingMarks) : undefined,
      topics: topicsArr,
      mistakes: mistakesText,
      mistakeTags: selectedTags,
      availableHoursPerDay: parseInt(studyHours) || 2,
    };
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    setIsLoading(true);
    setLoadingMsgIdx(0);
    setError("");

    try {
      const currentInput = buildInput();

      if (isRetake && prevInput) {
        const compResult = await comparePerformance(prevInput, currentInput);
        saveSession(currentInput, compResult.updatedPlan, compResult);
        // Persist to history immediately
        const payload: SessionPayload = { input: currentInput, result: compResult.updatedPlan, comparison: compResult, timestamp: Date.now() };
        if (user) saveSessionToCloud(user.uid, payload).catch(() => {});
      } else {
        const result = await analyzePerformance(currentInput);
        saveSession(currentInput, result);
        // Persist to history immediately
        const payload: SessionPayload = { input: currentInput, result, timestamp: Date.now() };
        if (user) saveSessionToCloud(user.uid, payload).catch(() => {});
      }

      router.push("/results");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setIsLoading(false);
    }
  };

  /* ── can-proceed guards ── */
  const canStep2 = !!activeSubject;
  const canStep3 = !!yourScore && !!outOf && Number(outOf) > 0;
  const canStep4 = allTopics.length > 0;

  /* ───────────────────── RENDER ───────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F2ED",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "80px",
      }}
    >
      {/* ── back link ── */}
      <div style={{ width: "100%", maxWidth: "640px", padding: "32px 24px 0" }}>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "14px",
            color: "#52514E",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </a>
      </div>

      {/* ── retake banner ── */}
      {isRetake && prevInput && (
        <div
          style={{
            width: "100%",
            maxWidth: "640px",
            padding: "0 24px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(13,13,13,0.10)",
              borderRadius: "10px",
              padding: "12px 20px",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "14px",
              color: "#52514E",
            }}
          >
            Previous attempt:{" "}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                color: "#0D0D0D",
              }}
            >
              {prevInput.totalScore}/{prevInput.maxScore}
            </span>{" "}
            on{" "}
            {prevSession?.timestamp
              ? new Date(prevSession.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "a previous date"}
          </div>
        </div>
      )}

      {/* ── step dots ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "28px",
          marginBottom: "36px",
          gap: "0px",
        }}
      >
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border:
                  s <= step
                    ? "2px solid #C9A84C"
                    : "2px solid rgba(13,13,13,0.10)",
                background:
                  s < step
                    ? "#C9A84C"
                    : s === step
                    ? "#FDF8EE"
                    : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s",
              }}
            >
              {s < step ? (
                <Check
                  style={{ width: 14, height: 14, color: "#fff" }}
                  strokeWidth={3}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: s === step ? "#C9A84C" : "#9E9B95",
                  }}
                >
                  {s}
                </span>
              )}
            </div>
            {s < 4 && (
              <div
                style={{
                  width: 48,
                  height: 2,
                  borderRadius: 1,
                  background:
                    s < step ? "#C9A84C" : "rgba(13,13,13,0.10)",
                  transition: "background 0.3s",
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── step card ── */}
      <div style={{ width: "100%", maxWidth: "640px", padding: "0 24px" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            padding: "48px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            width: "100%",
          }}
        >
          {/* ========== STEP 1 ========== */}
          {step === 1 && (
            <div>
              <TargetCursor spinDuration={2} hideDefaultCursor parallaxOn hoverDuration={0.2} />
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: isRetake ? "36px" : "32px",
                  color: "#0D0D0D",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {isRetake
                  ? "Let's see how much you've improved."
                  : "What subject do you want to analyze?"}
              </h2>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "16px",
                  color: "#52514E",
                  marginTop: "8px",
                  lineHeight: 1.5,
                }}
              >
                {isRetake
                  ? "Enter your latest test results — PathAI will compare them to your previous attempt."
                  : "We'll tailor the topic breakdown to your syllabus."}
              </p>

              {/* subject grid */}
              {isRetake && prevInput ? (
                /* locked subject in retake mode */
                <div
                  style={{
                    marginTop: "32px",
                    padding: "20px 24px",
                    background: "#FDF8EE",
                    border: "2px solid #C9A84C",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>
                    {subjects.find((s) => s.name === prevInput.subject)?.icon ?? "📚"}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Casson', serif",
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "#0D0D0D",
                      letterSpacing: "0.02em"
                    }}
                  >
                    {prevInput.subject}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "12px",
                      color: "#9E9B95",
                      marginLeft: "auto",
                    }}
                  >
                    Locked from previous
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginTop: "32px",
                  }}
                >
                  {subjects.map((s) => {
                    const active = selectedSubject === s.name;
                    return (
                      <button
                        key={s.name}
                        className="cursor-target"
                        onClick={() => {
                          setSelectedSubject(s.name);
                          setCustomSubject("");
                        }}
                        style={{
                          position: "relative",
                          textAlign: "left",
                          fontFamily: "'Outfit', sans-serif",
                          cursor: "pointer",
                          background: active ? "#FDF8EE" : "#fff",
                          border: active
                            ? "2px solid #C9A84C"
                            : "1.5px solid rgba(13,13,13,0.10)",
                          borderRadius: "12px",
                          padding: "20px 24px",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {active && (
                          <div
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#C9A84C",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check
                              style={{ width: 12, height: 12, color: "#fff" }}
                              strokeWidth={3}
                            />
                          </div>
                        )}
                        <span style={{ fontSize: "20px" }}>{s.icon}</span>
                        <span
                          style={{
                            fontFamily: "'Casson', serif",
                            fontSize: "20px",
                            fontWeight: 500,
                            letterSpacing: "0.02em",
                            color: "#0D0D0D",
                          }}
                        >
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* manual input (hidden in retake) */}
              {!isRetake && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => {
                    setCustomSubject(e.target.value);
                    setSelectedSubject("");
                  }}
                  placeholder="Or type your subject manually"
                  style={{
                    marginTop: "20px",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "15px",
                    border: "1px solid rgba(13,13,13,0.10)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    background: "#fff",
                    color: "#0D0D0D",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}

              {/* nav */}
              <div
                style={{
                  marginTop: "36px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="cursor-target"
                  onClick={() => canStep2 && setStep(2)}
                  disabled={!canStep2}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#fff",
                    background: canStep2 ? "#C9A84C" : "#9E9B95",
                    border: "none",
                    borderRadius: "999px",
                    padding: "12px 28px",
                    cursor: canStep2 ? "pointer" : "not-allowed",
                    opacity: canStep2 ? 1 : 0.5,
                    transition: "all 0.3s",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 2 ========== */}
          {step === 2 && (
            <div>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "32px",
                  color: "#0D0D0D",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                How did you score overall?
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginTop: "32px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#52514E",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Your score
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={yourScore}
                    onChange={(e) => setYourScore(e.target.value)}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "28px",
                      border: "1.5px solid rgba(13,13,13,0.10)",
                      borderRadius: "10px",
                      padding: "16px",
                      background: "#fff",
                      color: "#0D0D0D",
                      width: "100%",
                      textAlign: "center",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#52514E",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Out of
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={outOf}
                    onChange={(e) => setOutOf(e.target.value)}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "28px",
                      border: "1.5px solid rgba(13,13,13,0.10)",
                      borderRadius: "10px",
                      padding: "16px",
                      background: "#fff",
                      color: "#0D0D0D",
                      width: "100%",
                      textAlign: "center",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* passing marks */}
              <div style={{ marginTop: "16px" }}>
                <label
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#52514E",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Passing marks (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  placeholder="e.g. 33"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "16px",
                    border: "1px solid rgba(13,13,13,0.10)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    background: "#fff",
                    color: "#0D0D0D",
                    width: "100%",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* percentage badge */}
              {pct !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: scoreColor(pct),
                    }}
                  >
                    {pct}%
                  </span>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: scoreColor(pct),
                      background: `${scoreColor(pct)}18`,
                      borderRadius: "999px",
                      padding: "5px 14px",
                    }}
                  >
                    {pct >= 75
                      ? "Good performance"
                      : pct >= 50
                      ? "Room to improve"
                      : "Needs attention"}
                  </span>
                </motion.div>
              )}

              {/* nav */}
              <div
                style={{
                  marginTop: "36px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setStep(1)}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#52514E",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => canStep3 && setStep(3)}
                  disabled={!canStep3}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#fff",
                    background: canStep3 ? "#C9A84C" : "#9E9B95",
                    border: "none",
                    borderRadius: "999px",
                    padding: "12px 28px",
                    cursor: canStep3 ? "pointer" : "not-allowed",
                    opacity: canStep3 ? 1 : 0.5,
                    transition: "all 0.3s",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 3 ========== */}
          {step === 3 && (
            <div>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "32px",
                  color: "#0D0D0D",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                How did you perform topic-by-topic?
              </h2>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "16px",
                  color: "#52514E",
                  marginTop: "8px",
                  lineHeight: 1.5,
                }}
              >
                Be as precise as you can — this is where PathAI does its best work.
              </p>

              <div
                style={{
                  marginTop: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                {allTopics.map((topic) => {
                  const val = topicScores[topic] ?? 50;
                  const isCustom = customTopics.includes(topic);
                  const color = scoreColor(val);
                  return (
                    <div key={topic}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: color,
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: "15px",
                              fontWeight: 500,
                              color: "#0D0D0D",
                            }}
                          >
                            {topic}
                          </span>
                          {isCustom && (
                            <button
                              onClick={() => removeCustomTopic(topic)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "#9E9B95",
                                cursor: "pointer",
                                display: "flex",
                              }}
                              aria-label={`Remove ${topic}`}
                            >
                              <X style={{ width: 14, height: 14 }} />
                            </button>
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: color,
                          }}
                        >
                          {val}%
                        </span>
                      </div>

                      <div style={{ position: "relative", height: "6px" }}>
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: "999px",
                            background: "#E8E5DF",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: `${val}%`,
                            borderRadius: "999px",
                            background: color,
                            transition: "width 0.15s, background 0.3s",
                          }}
                        />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={val}
                          onChange={(e) =>
                            setTopicScore(topic, Number(e.target.value))
                          }
                          style={{
                            position: "absolute",
                            top: "-7px",
                            left: 0,
                            width: "100%",
                            height: "20px",
                            opacity: 0,
                            cursor: "pointer",
                            margin: 0,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* add custom topic */}
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
                  placeholder="New topic name"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "14px",
                    border: "1px solid rgba(13,13,13,0.10)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    background: "#fff",
                    color: "#0D0D0D",
                    flex: 1,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={addCustomTopic}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#52514E",
                    background: "none",
                    border: "none",
                    padding: "8px 4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Plus style={{ width: 14, height: 14 }} />
                  Add topic
                </button>
              </div>

              {/* nav */}
              <div
                style={{
                  marginTop: "36px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setStep(2)}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#52514E",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => canStep4 && setStep(4)}
                  disabled={!canStep4}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#fff",
                    background: canStep4 ? "#C9A84C" : "#9E9B95",
                    border: "none",
                    borderRadius: "999px",
                    padding: "12px 28px",
                    cursor: canStep4 ? "pointer" : "not-allowed",
                    opacity: canStep4 ? 1 : 0.5,
                    transition: "all 0.3s",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 4 ========== */}
          {step === 4 && (
            <div>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "32px",
                  color: "#0D0D0D",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                Tell us about your mistakes.
              </h2>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "16px",
                  color: "#52514E",
                  marginTop: "8px",
                  lineHeight: 1.5,
                }}
              >
                This is optional but dramatically improves your recommendations.
              </p>

              <textarea
                value={mistakesText}
                onChange={(e) => setMistakesText(e.target.value)}
                placeholder="e.g. I kept confusing integration by parts with substitution. I ran out of time in the last section..."
                style={{
                  marginTop: "28px",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "15px",
                  border: "1px solid rgba(13,13,13,0.10)",
                  borderRadius: "10px",
                  padding: "16px",
                  minHeight: "120px",
                  resize: "none",
                  background: "#fff",
                  color: "#0D0D0D",
                  lineHeight: 1.6,
                  width: "100%",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* mistake type tags */}
              <div style={{ marginTop: "24px" }}>
                <label
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#52514E",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  What type of mistakes?
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {MISTAKE_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          setSelectedTags((prev) =>
                            active
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          )
                        }
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: "13px",
                          padding: "6px 14px",
                          borderRadius: "999px",
                          border: active
                            ? "1px solid #C9A84C"
                            : "1px solid rgba(13,13,13,0.10)",
                          background: active ? "#C9A84C" : "#fff",
                          color: active ? "#fff" : "#52514E",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* study hours */}
              <div style={{ marginTop: "24px" }}>
                <label
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#52514E",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Study hours available per day
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {HOUR_OPTIONS.map((h) => {
                    const active = studyHours === h;
                    return (
                      <button
                        key={h}
                        onClick={() => setStudyHours(h)}
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: "13px",
                          padding: "6px 14px",
                          borderRadius: "999px",
                          border: active
                            ? "1px solid #2D6A4F"
                            : "1px solid rgba(13,13,13,0.10)",
                          background: active ? "#2D6A4F" : "#fff",
                          color: active ? "#fff" : "#52514E",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* back */}
              <div
                style={{
                  marginTop: "36px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setStep(3)}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#52514E",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  ← Back
                </button>
                <div />
              </div>

              {/* error display */}
              {error && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 16px",
                    background: "rgba(155,35,53,0.08)",
                    border: "1px solid rgba(155,35,53,0.20)",
                    borderRadius: "10px",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "14px",
                    color: "#9B2335",
                  }}
                >
                  {error}
                </div>
              )}

              {/* submit button */}
              <button
                onClick={handleSubmit}
                style={{
                  marginTop: "12px",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#fff",
                  background: "#C9A84C",
                  border: "none",
                  borderRadius: "999px",
                  padding: "16px 0",
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.3s",
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#A07830";
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(201,168,76,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#C9A84C";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {isRetake
                  ? "Compare & Update My Plan →"
                  : "Generate My Learning Path →"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ LOADING OVERLAY ═══════════ */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(245,242,237,0.95)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "32px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#C9A84C",
                    display: "inline-block",
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsgIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "28px",
                  fontStyle: "italic",
                  color: "#0D0D0D",
                  textAlign: "center",
                  maxWidth: "440px",
                  lineHeight: 1.3,
                  padding: "0 24px",
                }}
              >
                {LOADING_MSGS[loadingMsgIdx]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Wrap in Suspense because useSearchParams throws without it in App Router */
export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#F5F2ED",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #E8E5DF",
              borderTop: "3px solid #C9A84C",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }
    >
      <AnalyzeInner />
    </Suspense>
  );
}
