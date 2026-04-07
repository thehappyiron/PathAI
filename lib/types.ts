/* ═══════════════════════════════════════
   PathAI — shared TypeScript types
   ═══════════════════════════════════════ */

/* ── Subject catalog ── */
export interface SubjectData {
  name: string;
  icon: string;
  color: string;
  topics: string[];
}

/* ── Student input ── */
export interface TopicScore {
  topic: string;
  score: number;
  maxScore: number;
}

export interface StudentInput {
  subject: string;
  totalScore: number;
  maxScore: number;
  passingMarks?: number;
  topics: TopicScore[];
  mistakes: string;
  mistakeTags: string[];
  availableHoursPerDay: number;
}

/* ── Analysis result ── */
export interface Resource {
  topic: string;
  title: string;
  type: "video" | "article" | "book" | "practice";
  description: string;
  searchQuery: string;
}

export interface PracticeQuestion {
  topic: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  hint: string;
}

export interface DayPlan {
  day: string;
  focus: string;
  tasks: string[];
  estimatedTime: string;
}

export interface AnalysisResult {
  overallAssessment: string;
  strengths: string[];
  weakAreas: string[];
  priorityOrder: string[];
  studyResources: Resource[];
  practiceQuestions: PracticeQuestion[];
  revisionStrategy: string;
  weeklyPlan: DayPlan[];
  motivationalMessage: string;
  estimatedImprovementDays: number;
}

/* ── Comparison (retake) ── */
export interface ComparisonResult {
  improvedTopics: string[];
  stillWeakTopics: string[];
  newWeakTopics: string[];
  overallChange: "improved" | "same" | "declined";
  changePercentage: number;
  updatedPlan: AnalysisResult;
  progressMessage: string;
}

/* ── Chat ── */
export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

/* ── Session storage ── */
export interface SessionPayload {
  input: StudentInput;
  result: AnalysisResult;
  comparison?: ComparisonResult;
  timestamp: number;
}
