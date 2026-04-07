/* ═══════════════════════════════════════
   PathAI — localStorage session management
   ═══════════════════════════════════════ */

import { StudentInput, AnalysisResult, ComparisonResult, SessionPayload } from "./types";

const KEY_CURRENT = "pathai_current";
const KEY_PREVIOUS = "pathai_previous";

/** Save a completed analysis session */
export function saveSession(
  input: StudentInput,
  result: AnalysisResult,
  comparison?: ComparisonResult
): void {
  const payload: SessionPayload = {
    input,
    result,
    comparison,
    timestamp: Date.now(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(payload));
  }
}

/** Retrieve the current session */
export function getCurrentSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_CURRENT);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

/** Retrieve the previous (archived) session */
export function getPreviousSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_PREVIOUS);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

/** Archive current → previous, clear current */
export function archiveSession(): void {
  if (typeof window === "undefined") return;
  const current = localStorage.getItem(KEY_CURRENT);
  if (current) {
    localStorage.setItem(KEY_PREVIOUS, current);
  }
  localStorage.removeItem(KEY_CURRENT);
}

/** Remove all stored sessions */
export function clearAll(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_CURRENT);
  localStorage.removeItem(KEY_PREVIOUS);
}
