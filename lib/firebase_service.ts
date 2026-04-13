import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit, doc, setDoc, increment } from "firebase/firestore";
import { SessionPayload } from "./types";

export interface ActivityPayload {
  date: string;
  totalMinutes: number;
}

/* ═══════════════════════════════════════════════
   LOCAL STORAGE KEYS
   ═══════════════════════════════════════════════ */
const historyKey = (uid: string) => `pathai_history_${uid}`;
const activityKey = (uid: string) => `pathai_activity_${uid}`;

/* ═══════════════════════════════════════════════
   HISTORY — SAVE
   ═══════════════════════════════════════════════ */
export async function saveSessionToCloud(userId: string, session: SessionPayload): Promise<string | null> {
  const cleanSession = JSON.parse(JSON.stringify(session)); // strip undefined for Firebase
  const entry = { ...cleanSession, timestamp: Date.now() };

  // ──── 1. ALWAYS save locally first (bulletproof) ────
  try {
    if (typeof window !== "undefined") {
      const key = historyKey(userId);
      const existing: any[] = JSON.parse(localStorage.getItem(key) || "[]");
      
      // Deduplicate by checking if a very recent entry with same score+subject exists (within 10s)
      const isDupe = existing.some(
        e => e.input?.totalScore === entry.input?.totalScore && 
             e.input?.maxScore === entry.input?.maxScore &&
             e.input?.subject === entry.input?.subject &&
             Math.abs((e.timestamp || 0) - entry.timestamp) < 10_000
      );
      
      if (!isDupe) {
        existing.unshift(entry);
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
        console.log(`✅ [PathAI] Session saved to localStorage (${existing.length} total entries)`);
      } else {
        console.log("⏭️ [PathAI] Duplicate session skipped in localStorage");
      }
    }
  } catch (e) {
    console.error("localStorage save failed:", e);
  }

  // ──── 2. Try Firestore (best-effort) ────
  try {
    const historyRef = collection(db, "users", userId, "history");
    const docRef = await addDoc(historyRef, {
      ...entry,
      createdAt: serverTimestamp(),
    });
    console.log("☁️ [PathAI] Session synced to Firestore:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.warn("☁️ [PathAI] Firestore write failed (using local fallback):", error?.code || error?.message);
    return "local-fallback";
  }
}

/* ═══════════════════════════════════════════════
   HISTORY — READ
   ═══════════════════════════════════════════════ */
export async function getCloudHistory(userId: string, maxResults = 50): Promise<SessionPayload[]> {
  // ──── 1. Always load from localStorage first ────
  let localHist: SessionPayload[] = [];
  try {
    if (typeof window !== "undefined") {
      localHist = JSON.parse(localStorage.getItem(historyKey(userId)) || "[]");
    }
  } catch { localHist = []; }

  // ──── 2. Try Firestore ────
  try {
    const historyRef = collection(db, "users", userId, "history");
    const q = query(historyRef, orderBy("createdAt", "desc"), limit(maxResults));
    const snap = await getDocs(q);
    const cloudHist = snap.docs.map(d => d.data() as SessionPayload);

    if (cloudHist.length > 0) {
      // Merge: cloud is authoritative, but append any local-only entries
      // (entries that exist locally but not in cloud — compare by timestamp)
      const cloudTimestamps = new Set(cloudHist.map(c => c.timestamp));
      const localOnly = localHist.filter(l => !cloudTimestamps.has(l.timestamp));
      const merged = [...cloudHist, ...localOnly].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      console.log(`📊 [PathAI] Loaded ${cloudHist.length} cloud + ${localOnly.length} local-only entries`);
      return merged;
    }
  } catch (error: any) {
    console.warn("☁️ [PathAI] Firestore read failed, using local:", error?.code || error?.message);
  }

  // ──── 3. Return local data (chronological: oldest first) ────
  console.log(`📊 [PathAI] Returning ${localHist.length} entries from localStorage`);
  return [...localHist].reverse(); // stored newest-first, return oldest-first for charts
}

/* ═══════════════════════════════════════════════
   ENGAGEMENT — TRACK TIME
   ═══════════════════════════════════════════════ */
export async function trackTimeSpent(userId: string, minutes: number = 1): Promise<void> {
  if (!userId) return;
  const today = new Date().toISOString().split("T")[0];

  // ──── 1. Save locally ────
  try {
    if (typeof window !== "undefined") {
      const key = activityKey(userId);
      const arr: ActivityPayload[] = JSON.parse(localStorage.getItem(key) || "[]");
      const existing = arr.find(a => a.date === today);
      if (existing) {
        existing.totalMinutes += minutes;
      } else {
        arr.unshift({ date: today, totalMinutes: minutes });
      }
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 30)));
    }
  } catch { /* ignore */ }

  // ──── 2. Try Firestore ────
  try {
    const docRef = doc(db, "users", userId, "activity", today);
    await setDoc(docRef, {
      date: today,
      totalMinutes: increment(minutes),
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn("☁️ [PathAI] Activity Firestore write failed:", e);
  }
}

/* ═══════════════════════════════════════════════
   ENGAGEMENT — READ
   ═══════════════════════════════════════════════ */
export async function getCloudActivity(userId: string, maxDays = 30): Promise<ActivityPayload[]> {
  let localActivity: ActivityPayload[] = [];
  try {
    if (typeof window !== "undefined") {
      localActivity = JSON.parse(localStorage.getItem(activityKey(userId)) || "[]");
    }
  } catch { localActivity = []; }

  try {
    const activityRef = collection(db, "users", userId, "activity");
    const q = query(activityRef, orderBy("date", "desc"), limit(maxDays));
    const snap = await getDocs(q);
    const cloudData = snap.docs.map(d => d.data() as ActivityPayload).reverse();
    if (cloudData.length > 0) return cloudData;
  } catch (e) {
    console.warn("☁️ [PathAI] Activity Firestore read failed:", e);
  }

  // Return local (chronological)
  return [...localActivity].reverse();
}
