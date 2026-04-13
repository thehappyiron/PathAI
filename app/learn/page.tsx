"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, ChevronRight, Play, CheckCircle, XCircle,
  Loader2, List, Award, Clock, Lightbulb, AlertTriangle, Target
} from "lucide-react";
import { curriculum, StdGroup, Standard, Subject, Topic } from "@/data/curriculum";

/* ═══ Types ═══ */
interface VideoItem {
  videoId: string; title: string; description: string;
  thumbnail: string; channelTitle: string;
}
interface QuizQuestion {
  id: number; question: string; options: string[];
  correctAnswer: number; explanation: string;
}
interface RoadmapStep {
  step: number; title: string; description: string;
  duration: string; tips: string;
}
interface Roadmap {
  title: string; overview: string; prerequisites: string[];
  steps: RoadmapStep[]; keyFormulas: string[];
  commonMistakes: string[]; examTips: string[];
}

type Screen = "groups" | "standards" | "subjects" | "topics" | "lesson";

/* ═══ Animations ═══ */
const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

/* ═══ Styles ═══ */
const S = {
  page: { minHeight: "100vh", background: "#F5F2ED", paddingTop: 80 } as React.CSSProperties,
  container: { maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" } as React.CSSProperties,
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none",
    cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 500,
    color: "#9E9B95", marginBottom: 24, padding: 0, transition: "color 0.2s",
  } as React.CSSProperties,
  heading: { fontFamily: "'DM Serif Display',serif", fontSize: 36, color: "#0D0D0D", margin: "0 0 8px" } as React.CSSProperties,
  sub: { fontFamily: "'Outfit',sans-serif", fontSize: 15, color: "#9E9B95", margin: "0 0 32px" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } as React.CSSProperties,
  card: (color: string) => ({
    background: "#fff", borderRadius: 16, padding: "28px 24px", border: "1px solid rgba(13,13,13,0.08)",
    cursor: "pointer", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 16,
    boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
  }) as React.CSSProperties,
  pill: (color: string) => ({
    display: "inline-block", fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "0.06em", color, background: `${color}18`,
    borderRadius: 999, padding: "4px 12px",
  }),
};

/* ═══════════════════════════════════════
   LEARN PAGE
   ═══════════════════════════════════════ */
export default function LearnPage() {
  const router = useRouter();

  /* ── navigation state ── */
  const [screen, setScreen] = useState<Screen>("groups");
  const [selectedGroup, setSelectedGroup] = useState<StdGroup | null>(null);
  const [selectedStd, setSelectedStd] = useState<Standard | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  /* ── lesson state ── */
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);

  /* ── quiz state ── */
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isFinalTest, setIsFinalTest] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(new Set());

  /* ── Back navigation ── */
  const goBack = () => {
    if (quizMode) { setQuizMode(false); setQuizFinished(false); return; }
    if (screen === "lesson") { setScreen("topics"); setRoadmap(null); setVideos([]); setVideoCompleted(false); setActiveVideoIdx(0); setCompletedVideos(new Set()); return; }
    if (selectedBranch) { setSelectedBranch(null); return; }
    if (screen === "topics") { setScreen("subjects"); setSelectedSubject(null); return; }
    if (screen === "subjects") { setScreen("standards"); setSelectedStd(null); return; }
    if (screen === "standards") { setScreen("groups"); setSelectedGroup(null); return; }
    router.push("/");
  };

  /* ── Fetch roadmap + videos ── */
  const loadLesson = useCallback(async (topicName: string) => {
    setSelectedTopic(topicName);
    setScreen("lesson");
    setLoadingRoadmap(true);
    setLoadingVideos(true);

    const stdLabel = selectedStd?.label || selectedGroup?.label || "";
    const subjectName = selectedSubject?.name || "";

    // Fetch roadmap
    fetch("/api/learn/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topicName, subject: subjectName, standard: stdLabel }),
    })
      .then(r => r.json())
      .then(data => { if (!data.error) setRoadmap(data); })
      .catch(e => console.error("Roadmap fetch error:", e))
      .finally(() => setLoadingRoadmap(false));

    // Fetch videos
    fetch("/api/learn/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topicName, subject: subjectName, standard: stdLabel }),
    })
      .then(r => r.json())
      .then(data => { if (data.videos) setVideos(data.videos); })
      .catch(e => console.error("YouTube fetch error:", e))
      .finally(() => setLoadingVideos(false));
  }, [selectedStd, selectedGroup, selectedSubject]);

  /* ── Start quiz ── */
  const startQuiz = async (difficulty: "easy" | "medium" | "hard", finalTest = false) => {
    setQuizDifficulty(difficulty);
    setIsFinalTest(finalTest);
    setQuizMode(true);
    setLoadingQuiz(true);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizFinished(false);

    try {
      const res = await fetch("/api/learn/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          subject: selectedSubject?.name || "",
          standard: selectedStd?.label || "",
          difficulty,
          count: finalTest ? 18 : 10,
          isFinalTest: finalTest,
        }),
      });
      const data = await res.json();
      if (data.questions) setQuizQuestions(data.questions);
    } catch (e) {
      console.error("Quiz fetch error:", e);
    } finally {
      setLoadingQuiz(false);
    }
  };

  /* ── Handle answer ── */
  const handleAnswer = (idx: number) => {
    if (showExplanation) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === quizQuestions[currentQ]?.correctAnswer) {
      setQuizScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= quizQuestions.length) {
      setQuizFinished(true);
    } else {
      setCurrentQ(q => q + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleVideoEnd = () => {
    const newCompleted = new Set(completedVideos);
    newCompleted.add(activeVideoIdx);
    setCompletedVideos(newCompleted);
    setVideoCompleted(true);
  };

  const goToNextVideo = () => {
    if (activeVideoIdx + 1 < videos.length) {
      setActiveVideoIdx(i => i + 1);
      setVideoCompleted(false);
    }
  };

  /* ── Get flat topics for a subject ── */
  const getTopics = (): { branch?: string; topics: Topic[] }[] => {
    if (!selectedSubject) return [];
    if (selectedSubject.branches) {
      if (selectedBranch) {
        const b = selectedSubject.branches.find(br => br.name === selectedBranch);
        return b ? [{ branch: b.name, topics: b.topics }] : [];
      }
      return selectedSubject.branches.map(b => ({ branch: b.name, topics: b.topics }));
    }
    return [{ topics: selectedSubject.topics || [] }];
  };

  const needsBranchSelection = selectedSubject?.branches && !selectedBranch;

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* Back button */}
        {screen !== "groups" && (
          <button onClick={goBack} style={S.backBtn} onMouseEnter={e => (e.currentTarget.style.color = "#0D0D0D")} onMouseLeave={e => (e.currentTarget.style.color = "#9E9B95")}>
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <AnimatePresence mode="wait">

          {/* ═══ SCREEN 1: Std Groups ═══ */}
          {screen === "groups" && (
            <motion.div key="groups" {...fadeSlide}>
              <h1 style={S.heading}>Start Learning</h1>
              <p style={S.sub}>Choose your class level to begin your learning journey.</p>

              <div style={S.grid2}>
                {curriculum.map(group => (
                  <div
                    key={group.id}
                    style={S.card(group.color)}
                    onClick={() => { setSelectedGroup(group); setScreen("standards"); }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = group.color + "40"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "rgba(13,13,13,0.08)"; }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, background: `${group.color}12`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0,
                    }}>
                      {group.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 600, color: "#0D0D0D" }}>{group.label}</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#9E9B95", marginTop: 2 }}>{group.range} Stage</div>
                    </div>
                    <ChevronRight size={18} color="#9E9B95" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ SCREEN 2: Standards ═══ */}
          {screen === "standards" && selectedGroup && (
            <motion.div key="standards" {...fadeSlide}>
              <h1 style={S.heading}>{selectedGroup.label}</h1>
              <p style={S.sub}>Choose a class to see its subjects and topics.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {selectedGroup.standards.map(std => (
                  <div
                    key={std.label}
                    style={S.card(selectedGroup.color)}
                    onClick={() => { setSelectedStd(std); setScreen("subjects"); }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.03)"; }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: `${selectedGroup.color}12`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: selectedGroup.color,
                    }}>
                      {std.label.replace("Std ", "")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 600, color: "#0D0D0D" }}>{std.label}</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#9E9B95" }}>{std.subjects.length} subjects</div>
                    </div>
                    <ChevronRight size={18} color="#9E9B95" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ SCREEN 3: Subjects ═══ */}
          {screen === "subjects" && selectedStd && (
            <motion.div key="subjects" {...fadeSlide}>
              <span style={S.pill(selectedGroup?.color || "#C9A84C")}>{selectedStd.label}</span>
              <h1 style={{ ...S.heading, marginTop: 12 }}>Choose a Subject</h1>
              <p style={S.sub}>Select a subject to explore its topics.</p>

              <div style={S.grid2}>
                {selectedStd.subjects.map(subj => (
                  <div
                    key={subj.name}
                    style={S.card(selectedGroup?.color || "#0D0D0D")}
                    onClick={() => { setSelectedSubject(subj); setSelectedBranch(null); setScreen("topics"); }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.03)"; }}
                  >
                    <div style={{ fontSize: 28 }}>{subj.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 600, color: "#0D0D0D" }}>{subj.name}</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95" }}>
                        {subj.topics ? `${subj.topics.length} topics` : subj.branches ? `${subj.branches.length} branches` : ""}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9E9B95" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ SCREEN 4: Topics (with branch sub-nav) ═══ */}
          {screen === "topics" && selectedSubject && !quizMode && (
            <motion.div key="topics" {...fadeSlide}>
              <span style={S.pill(selectedGroup?.color || "#C9A84C")}>{selectedStd?.label} • {selectedSubject.name}</span>
              <h1 style={{ ...S.heading, marginTop: 12 }}>
                {needsBranchSelection ? "Choose a Branch" : (selectedBranch || "Topics")}
              </h1>

              {/* Branch selector */}
              {needsBranchSelection ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                  {selectedSubject.branches!.map(b => (
                    <div
                      key={b.name}
                      style={S.card(selectedGroup?.color || "#0D0D0D")}
                      onClick={() => setSelectedBranch(b.name)}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.03)"; }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 600, color: "#0D0D0D" }}>{b.name}</div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95" }}>{b.topics.length} topics</div>
                      </div>
                      <ChevronRight size={18} color="#9E9B95" />
                    </div>
                  ))}
                </div>
              ) : (
                /* Topic list */
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
                  {getTopics().map(group => (
                    <React.Fragment key={group.branch || "root"}>
                      {group.topics.map((t, i) => (
                        <div
                          key={t.name}
                          style={{
                            ...S.card(selectedGroup?.color || "#0D0D0D"),
                            padding: "18px 20px",
                          }}
                          onClick={() => loadLesson(t.name)}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.03)"; }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, background: `${selectedGroup?.color || "#C9A84C"}12`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: selectedGroup?.color || "#C9A84C",
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 500, color: "#0D0D0D" }}>{t.name}</div>
                          </div>
                          <BookOpen size={16} color="#9E9B95" />
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ SCREEN 5: LESSON (Roadmap + Video + Quiz) ═══ */}
          {screen === "lesson" && !quizMode && (
            <motion.div key="lesson" {...fadeSlide}>
              <span style={S.pill(selectedGroup?.color || "#C9A84C")}>
                {selectedStd?.label} • {selectedSubject?.name} {selectedBranch ? `• ${selectedBranch}` : ""}
              </span>
              <h1 style={{ ...S.heading, marginTop: 12 }}>{selectedTopic}</h1>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32 }}>

                {/* ── Left: Roadmap ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: "#0D0D0D", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Target size={18} color="#C9A84C" /> Learning Roadmap
                  </h3>

                  {loadingRoadmap ? (
                    <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: "1px solid rgba(13,13,13,0.08)" }}>
                      <Loader2 size={28} color="#C9A84C" style={{ animation: "spin 1s linear infinite" }} />
                      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", marginTop: 12 }}>Generating your roadmap...</p>
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                  ) : roadmap ? (
                    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid rgba(13,13,13,0.08)", maxHeight: 600, overflowY: "auto" }}>
                      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#52514E", lineHeight: 1.6, margin: "0 0 20px" }}>{roadmap.overview}</p>

                      {roadmap.prerequisites?.length > 0 && (
                        <div style={{ background: "rgba(201,168,76,0.06)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#C9A84C", textTransform: "uppercase", marginBottom: 8 }}>Prerequisites</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {roadmap.prerequisites.map((p, i) => (
                              <span key={i} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#52514E", background: "rgba(201,168,76,0.12)", borderRadius: 999, padding: "3px 10px" }}>{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Steps */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {roadmap.steps?.map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: 12 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", background: "#2D6A4F", color: "#fff",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, marginTop: 2,
                            }}>{s.step}</div>
                            <div>
                              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: "#0D0D0D" }}>{s.title}</div>
                              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#52514E", lineHeight: 1.5, marginTop: 4 }}>{s.description}</div>
                              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9E9B95", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {s.duration}</span>
                                {s.tips && <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#C9A84C", display: "flex", alignItems: "center", gap: 4 }}><Lightbulb size={11} /> {s.tips}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Key Formulas */}
                      {roadmap.keyFormulas?.length > 0 && (
                        <div style={{ marginTop: 20, background: "rgba(45,106,79,0.06)", borderRadius: 12, padding: 16 }}>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#2D6A4F", textTransform: "uppercase", marginBottom: 8 }}>Key Formulas / Facts</div>
                          {roadmap.keyFormulas.map((f, i) => (
                            <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#0D0D0D", padding: "4px 0" }}>• {f}</div>
                          ))}
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {roadmap.commonMistakes?.length > 0 && (
                        <div style={{ marginTop: 16, background: "rgba(155,35,53,0.06)", borderRadius: 12, padding: 16 }}>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#9B2335", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Common Mistakes</div>
                          {roadmap.commonMistakes.map((m, i) => (
                            <div key={i} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#52514E", padding: "3px 0" }}>• {m}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* ── Right: Video + Quiz Trigger ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: "#0D0D0D", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Play size={18} color="#9B2335" /> Video Lessons
                  </h3>

                  {loadingVideos ? (
                    <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: "1px solid rgba(13,13,13,0.08)" }}>
                      <Loader2 size={28} color="#9B2335" style={{ animation: "spin 1s linear infinite" }} />
                      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", marginTop: 12 }}>Finding the best videos...</p>
                    </div>
                  ) : videos.length > 0 ? (
                    <>
                      {/* YouTube Player */}
                      <div style={{ borderRadius: 16, overflow: "hidden", background: "#000", aspectRatio: "16/9", position: "relative" }}>
                        <iframe
                          key={videos[activeVideoIdx]?.videoId}
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${videos[activeVideoIdx]?.videoId}?enablejsapi=1&rel=0`}
                          title={videos[activeVideoIdx]?.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: "absolute", inset: 0 }}
                        />
                      </div>

                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: "#0D0D0D" }}>
                        {videos[activeVideoIdx]?.title}
                      </div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#9E9B95" }}>
                        {videos[activeVideoIdx]?.channelTitle} • Video {activeVideoIdx + 1} of {videos.length}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          onClick={handleVideoEnd}
                          style={{
                            fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600,
                            background: videoCompleted ? "#2D6A4F" : "#0D0D0D", color: "#fff",
                            border: "none", borderRadius: 999, padding: "10px 20px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                          }}
                        >
                          <CheckCircle size={14} /> {videoCompleted ? "Completed ✓" : "Mark as Watched"}
                        </button>

                        {videoCompleted && (
                          <>
                            {/* Quiz buttons */}
                            <button onClick={() => startQuiz("easy")} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, background: "rgba(45,106,79,0.10)", color: "#2D6A4F", border: "1px solid rgba(45,106,79,0.2)", borderRadius: 999, padding: "10px 16px", cursor: "pointer" }}>
                              Quiz: Easy
                            </button>
                            <button onClick={() => startQuiz("medium")} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, background: "rgba(201,168,76,0.10)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 999, padding: "10px 16px", cursor: "pointer" }}>
                              Quiz: Medium
                            </button>
                            <button onClick={() => startQuiz("hard")} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, background: "rgba(155,35,53,0.10)", color: "#9B2335", border: "1px solid rgba(155,35,53,0.2)", borderRadius: 999, padding: "10px 16px", cursor: "pointer" }}>
                              Quiz: Hard
                            </button>
                          </>
                        )}

                        {videoCompleted && activeVideoIdx + 1 < videos.length && (
                          <button onClick={goToNextVideo} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, background: "#C9A84C", color: "#fff", border: "none", borderRadius: 999, padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            Next Video <ChevronRight size={14} />
                          </button>
                        )}
                      </div>

                      {/* Playlist / Video list */}
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: "#9E9B95", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <List size={14} /> Playlist ({videos.length} videos)
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                          {videos.map((v, i) => (
                            <div
                              key={v.videoId}
                              onClick={() => { setActiveVideoIdx(i); setVideoCompleted(completedVideos.has(i)); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                                borderRadius: 10, cursor: "pointer", transition: "background 0.2s",
                                background: i === activeVideoIdx ? "rgba(201,168,76,0.10)" : "transparent",
                                border: i === activeVideoIdx ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
                              }}
                              onMouseEnter={e => { if (i !== activeVideoIdx) e.currentTarget.style.background = "#FAFAF8"; }}
                              onMouseLeave={e => { if (i !== activeVideoIdx) e.currentTarget.style.background = "transparent"; }}
                            >
                              {completedVideos.has(i) ? (
                                <CheckCircle size={14} color="#2D6A4F" />
                              ) : (
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#9E9B95", width: 14, textAlign: "center" }}>{i + 1}</span>
                              )}
                              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: i === activeVideoIdx ? "#0D0D0D" : "#52514E", fontWeight: i === activeVideoIdx ? 600 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {v.title.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Final test (after watching all) */}
                      {completedVideos.size === videos.length && videos.length > 0 && (
                        <div style={{ background: "rgba(155,35,53,0.06)", border: "1px solid rgba(155,35,53,0.15)", borderRadius: 16, padding: 24, textAlign: "center", marginTop: 8 }}>
                          <Award size={32} color="#9B2335" style={{ marginBottom: 8 }} />
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: "#0D0D0D" }}>All videos completed! 🎉</div>
                          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#52514E", margin: "8px 0 16px" }}>
                            Take the final comprehensive test to check your mastery.
                          </p>
                          <button
                            onClick={() => startQuiz("medium", true)}
                            style={{
                              fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600,
                              background: "#9B2335", color: "#fff", border: "none", borderRadius: 999,
                              padding: "12px 28px", cursor: "pointer",
                            }}
                          >
                            🏆 Start Final Test (15-20 Questions)
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", border: "1px solid rgba(13,13,13,0.08)" }}>
                      <Play size={32} color="#9E9B95" style={{ opacity: 0.4 }} />
                      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", marginTop: 12 }}>No videos found for this topic.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ QUIZ SCREEN ═══ */}
          {quizMode && (
            <motion.div key="quiz" {...fadeSlide}>
              <span style={S.pill(isFinalTest ? "#9B2335" : "#C9A84C")}>
                {isFinalTest ? "🏆 Final Test" : `Quiz • ${quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)}`}
              </span>
              <h1 style={{ ...S.heading, marginTop: 12 }}>{selectedTopic}</h1>

              {loadingQuiz ? (
                <div style={{ background: "#fff", borderRadius: 16, padding: 64, textAlign: "center", border: "1px solid rgba(13,13,13,0.08)", marginTop: 24 }}>
                  <Loader2 size={32} color="#C9A84C" style={{ animation: "spin 1s linear infinite" }} />
                  <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: "#9E9B95", marginTop: 16 }}>
                    Generating {isFinalTest ? "final test" : "quiz"} questions...
                  </p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : quizFinished ? (
                /* ── Results ── */
                <div style={{ background: "#fff", borderRadius: 20, padding: 48, textAlign: "center", border: "1px solid rgba(13,13,13,0.08)", marginTop: 24, maxWidth: 500, marginInline: "auto" }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
                    background: quizScore >= quizQuestions.length * 0.7 ? "rgba(45,106,79,0.12)" : quizScore >= quizQuestions.length * 0.4 ? "rgba(201,168,76,0.12)" : "rgba(155,35,53,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Award size={36} color={quizScore >= quizQuestions.length * 0.7 ? "#2D6A4F" : quizScore >= quizQuestions.length * 0.4 ? "#C9A84C" : "#9B2335"} />
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 48, fontWeight: 700, color: "#0D0D0D" }}>
                    {quizScore}<span style={{ fontSize: 24, color: "#9E9B95" }}>/{quizQuestions.length}</span>
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 600, color: "#0D0D0D", marginTop: 8 }}>
                    {quizScore >= quizQuestions.length * 0.7 ? "Excellent! 🎯" : quizScore >= quizQuestions.length * 0.4 ? "Good effort! 💪" : "Keep practicing! 📚"}
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#9E9B95", marginTop: 4 }}>
                    {Math.round((quizScore / quizQuestions.length) * 100)}% correct
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
                    <button onClick={() => { setQuizMode(false); setQuizFinished(false); }} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, background: "#0D0D0D", color: "#fff", border: "none", borderRadius: 999, padding: "12px 24px", cursor: "pointer" }}>
                      Back to Lesson
                    </button>
                    <button onClick={() => startQuiz(quizDifficulty, isFinalTest)} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, background: "#C9A84C", color: "#fff", border: "none", borderRadius: 999, padding: "12px 24px", cursor: "pointer" }}>
                      Retry
                    </button>
                  </div>
                </div>
              ) : quizQuestions.length > 0 ? (
                /* ── Active Question ── */
                <div style={{ maxWidth: 700, margin: "24px auto 0" }}>
                  {/* Progress bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 6, background: "rgba(13,13,13,0.08)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${((currentQ + 1) / quizQuestions.length) * 100}%`, background: "#C9A84C", borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#9E9B95" }}>
                      {currentQ + 1}/{quizQuestions.length}
                    </span>
                  </div>

                  <div style={{ background: "#fff", borderRadius: 20, padding: 32, border: "1px solid rgba(13,13,13,0.08)" }}>
                    <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 600, color: "#0D0D0D", lineHeight: 1.5, margin: "0 0 24px" }}>
                      {quizQuestions[currentQ]?.question}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {quizQuestions[currentQ]?.options.map((opt, i) => {
                        const isCorrect = i === quizQuestions[currentQ]?.correctAnswer;
                        const isSelected = i === selectedAnswer;
                        let bg = "#FAFAF8";
                        let border = "1px solid rgba(13,13,13,0.08)";
                        if (showExplanation) {
                          if (isCorrect) { bg = "rgba(45,106,79,0.10)"; border = "1px solid rgba(45,106,79,0.3)"; }
                          else if (isSelected && !isCorrect) { bg = "rgba(155,35,53,0.10)"; border = "1px solid rgba(155,35,53,0.3)"; }
                        } else if (isSelected) { bg = "rgba(201,168,76,0.10)"; border = "1px solid rgba(201,168,76,0.3)"; }

                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            style={{
                              width: "100%", textAlign: "left", padding: "14px 18px", borderRadius: 14,
                              background: bg, border, cursor: showExplanation ? "default" : "pointer",
                              fontFamily: "'Outfit',sans-serif", fontSize: 15, color: "#0D0D0D",
                              display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s",
                            }}
                          >
                            {showExplanation && isCorrect && <CheckCircle size={16} color="#2D6A4F" />}
                            {showExplanation && isSelected && !isCorrect && <XCircle size={16} color="#9B2335" />}
                            {!showExplanation && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#9E9B95", width: 16 }}>{String.fromCharCode(65 + i)}</span>}
                            {opt.replace(/^[A-D]\)\s*/, "")}
                          </button>
                        );
                      })}
                    </div>

                    {showExplanation && (
                      <div style={{ marginTop: 20, background: "rgba(201,168,76,0.06)", borderLeft: "3px solid #C9A84C", borderRadius: "0 10px 10px 0", padding: "12px 16px" }}>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#C9A84C", textTransform: "uppercase" }}>Explanation</div>
                        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: "#52514E", margin: "4px 0 0", lineHeight: 1.5 }}>
                          {quizQuestions[currentQ]?.explanation}
                        </p>
                      </div>
                    )}

                    {showExplanation && (
                      <button
                        onClick={nextQuestion}
                        style={{
                          marginTop: 20, fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600,
                          background: "#C9A84C", color: "#fff", border: "none", borderRadius: 999,
                          padding: "12px 28px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        {currentQ + 1 >= quizQuestions.length ? "See Results" : "Next Question"} <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
