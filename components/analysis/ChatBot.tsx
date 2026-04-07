"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ArrowUp } from "lucide-react";
import { StudentInput, AnalysisResult, ChatMessage } from "@/lib/types";
import { chatWithTutor } from "@/lib/gemini";

interface Props {
  input: StudentInput;
  result: AnalysisResult;
}

export default function ChatBot({ input, result }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* seed welcome message on first open */
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "model",
          content: `Hi! I'm your PathAI tutor. I know your weak areas are ${result.weakAreas.join(
            ", "
          )}. Ask me anything about ${input.subject} — I'm here to help. 💡`,
        },
      ]);
    }
    if (open) inputRef.current?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = draft.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setLoading(true);

    const reply = await chatWithTutor(input, result, messages, text);
    setMessages((prev) => [...prev, { role: "model", content: reply }]);
    setLoading(false);
  };

  return (
    <>
      {/* ── toggle button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 90,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#C9A84C",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(201,168,76,0.4)",
          transition: "transform 0.2s",
        }}
        aria-label="Toggle chat"
      >
        {open ? (
          <X style={{ width: 22, height: 22, color: "#fff" }} />
        ) : (
          <MessageCircle style={{ width: 22, height: 22, color: "#fff" }} />
        )}
      </button>

      {/* ── panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{
              position: "fixed",
              bottom: 92,
              right: 24,
              zIndex: 91,
              width: 380,
              height: 520,
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "1px solid rgba(13,13,13,0.10)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* header */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid rgba(13,13,13,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#0D0D0D",
                  }}
                >
                  PathAI Tutor
                </span>
                {/* green pulse dot */}
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2D6A4F",
                    display: "inline-block",
                    animation: "pulse-dot 2s infinite",
                  }}
                />
                <style jsx>{`
                  @keyframes pulse-dot {
                    0%,
                    100% {
                      opacity: 1;
                    }
                    50% {
                      opacity: 0.3;
                    }
                  }
                `}</style>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9E9B95",
                  display: "flex",
                  padding: 4,
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* chat area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    maxWidth: "85%",
                    alignSelf:
                      msg.role === "user" ? "flex-end" : "flex-start",
                    background:
                      msg.role === "user" ? "#C9A84C" : "#F5F2ED",
                    color: msg.role === "user" ? "#fff" : "#0D0D0D",
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 4px 12px"
                        : "12px 12px 12px 4px",
                    padding: "10px 14px",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "14px",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              ))}

              {/* loading dots */}
              {loading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: "#F5F2ED",
                    borderRadius: "12px 12px 12px 4px",
                    padding: "12px 18px",
                    display: "flex",
                    gap: 5,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#9E9B95",
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* input area */}
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid rgba(13,13,13,0.10)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={loading}
                placeholder="Ask about your weak areas..."
                style={{
                  flex: 1,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "14px",
                  border: "1px solid rgba(13,13,13,0.10)",
                  borderRadius: "999px",
                  padding: "10px 18px",
                  outline: "none",
                  background: "#fff",
                  color: "#0D0D0D",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={send}
                disabled={loading || !draft.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background:
                    loading || !draft.trim() ? "#E8E5DF" : "#C9A84C",
                  border: "none",
                  cursor:
                    loading || !draft.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                <ArrowUp
                  style={{ width: 18, height: 18, color: "#fff" }}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
