"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ScanLine, ImageOff, Upload, Camera } from "lucide-react";
import { analyzeMarksheetImage } from "@/lib/gemini";
import { saveSession } from "@/lib/storage";

/* ─── scanning status messages ─── */
const STATUS_MESSAGES = [
  "Reading your marksheet...",
  "Identifying subjects and scores...",
  "Detecting weak areas...",
  "Building your learning path...",
];

/* ═══════════════════════════════════════
   SCAN PAGE
   ═══════════════════════════════════════ */
export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "loading" | "error">("upload");
  const [statusIdx, setStatusIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  /* ─── file selection handler ─── */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  /* ─── clear selection ─── */
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, []);

  /* ─── drag & drop ─── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  /* ─── analyze ─── */
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setStep("loading");
    setStatusIdx(0);

    // Cycle status messages
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip data URI prefix
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const mimeType = selectedFile.type || "image/jpeg";
      const { analysis, input } = await analyzeMarksheetImage(base64, mimeType);

      clearInterval(interval);

      // Save and redirect
      saveSession(input, analysis);
      router.push("/results");
    } catch (err: any) {
      clearInterval(interval);
      if (err.message === "LOW_CONFIDENCE") {
        setErrorMessage("low_confidence");
      } else {
        setErrorMessage(err.message || "Something went wrong. Please try again.");
      }
      setStep("error");
    }
  }, [selectedFile, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ── back arrow ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          padding: "32px 24px 0",
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-muted)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 15,
            fontWeight: 500,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-muted)")}
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      {/* ═══ STEP 1: UPLOAD ═══ */}
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            style={{
              width: "100%",
              maxWidth: 600,
              padding: "48px 24px 80px",
            }}
          >
            {/* heading */}
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 48,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Upload your marksheet.
            </h1>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                color: "var(--ink-muted)",
                marginTop: 12,
                lineHeight: 1.55,
              }}
            >
              Any marksheet, result slip, or answer sheet.
              <br />
              PathAI reads it automatically — no manual entry needed.
            </p>

            {/* upload zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              style={{
                marginTop: 48,
                border: `2px dashed var(--accent-gold)`,
                borderRadius: 24,
                padding: previewUrl ? "32px" : "64px 48px",
                background: "#FFFFFF",
                cursor: previewUrl ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              {!previewUrl ? (
                <>
                  <ScanLine
                    size={52}
                    style={{ color: "var(--accent-gold)" }}
                  />
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--ink)",
                      marginTop: 16,
                      marginBottom: 0,
                    }}
                  >
                    Drop your marksheet here
                  </p>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14,
                      color: "var(--ink-faint)",
                      marginTop: 8,
                      marginBottom: 0,
                    }}
                  >
                    JPG, PNG, PDF screenshot — any format works
                  </p>

                  {/* buttons row */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 32,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                        background: "transparent",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 999,
                        padding: "10px 24px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--ink)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--ink)";
                      }}
                    >
                      <Upload size={16} /> Upload File
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                        background: "transparent",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 999,
                        padding: "10px 24px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--ink)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--ink)";
                      }}
                    >
                      <Camera size={16} /> Use Camera
                    </button>
                  </div>
                </>
              ) : (
                /* ── preview state ── */
                <>
                  <img
                    src={previewUrl}
                    alt="Marksheet preview"
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      objectFit: "cover",
                      borderRadius: 16,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      color: "var(--ink-faint)",
                      marginTop: 12,
                      marginBottom: 0,
                    }}
                  >
                    {selectedFile?.name}
                  </p>

                  <button
                    onClick={handleAnalyze}
                    style={{
                      width: "100%",
                      marginTop: 24,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#fff",
                      background: "var(--accent-gold)",
                      border: "none",
                      borderRadius: 999,
                      padding: "14px 32px",
                      cursor: "pointer",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-gold-dark)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--accent-gold)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    Looks good? Analyze it →
                  </button>

                  <button
                    onClick={handleClear}
                    style={{
                      marginTop: 12,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14,
                      color: "var(--ink-faint)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Choose different image
                  </button>
                </>
              )}
            </div>

            {/* hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </motion.div>
        )}

        {/* ═══ STEP 2: LOADING ═══ */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(245,242,237,0.97)",
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            {/* scanning visual */}
            <div
              style={{
                position: "relative",
                width: 280,
                height: 320,
                borderRadius: 20,
                overflow: "hidden",
                border: "2px solid var(--border)",
              }}
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Scanning"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.35,
                  }}
                />
              )}
              {/* Scanning line */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, transparent, var(--accent-gold), transparent)",
                  boxShadow: "0 0 20px var(--accent-gold)",
                  animation: "scanLine 2s ease-in-out infinite",
                }}
              />
            </div>

            {/* rotating status text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 28,
                  fontStyle: "italic",
                  color: "var(--ink)",
                  marginTop: 40,
                  textAlign: "center",
                }}
              >
                {STATUS_MESSAGES[statusIdx]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══ STEP 3: ERROR ═══ */}
        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            style={{
              width: "100%",
              maxWidth: 600,
              padding: "80px 24px",
              textAlign: "center",
            }}
          >
            <ImageOff
              size={48}
              style={{ color: "var(--accent-crimson)", margin: "0 auto" }}
            />
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 32,
                color: "var(--ink)",
                marginTop: 24,
              }}
            >
              Couldn&apos;t read this clearly.
            </h2>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 16,
                color: "var(--ink-muted)",
                marginTop: 12,
                lineHeight: 1.55,
                maxWidth: 420,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {errorMessage === "low_confidence"
                ? "Try better lighting, hold the camera steady, or upload a clearer photo."
                : errorMessage}
            </p>

            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                marginTop: 32,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  handleClear();
                  setStep("upload");
                }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  background: "var(--accent-gold)",
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 32px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--accent-gold-dark)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--accent-gold)")
                }
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/analyze")}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink-muted)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Enter Manually Instead →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* scanning animation keyframes */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
