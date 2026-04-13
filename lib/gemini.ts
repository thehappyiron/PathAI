/* ═══════════════════════════════════════
   PathAI — Gemini 2.5 Flash integration
   ═══════════════════════════════════════ */

import {
  StudentInput,
  AnalysisResult,
  ComparisonResult,
  ChatMessage,
} from "./types";

const API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const MODEL = "llama-3.1-8b-instant";
const ENDPOINT = `https://api.groq.com/openai/v1/chat/completions`;

/* ─────────── low-level call ─────────── */

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 429 && retries > 0) {
    console.warn("API Rate limit hit (429). Pausing for 5s to respect quotas...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return fetchWithRetry(url, options, retries - 1);
  }
  return res;
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2500,
  };

  const res = await fetchWithRetry(ENDPOINT, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(
      `Groq API ${res.status}: ${err || res.statusText}`
    );
  }

  const json = await res.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  return text;
}

async function callGeminiMultiTurn(
  systemPrompt: string,
  messages: { role: "user" | "model"; text: string }[]
): Promise<string> {
  const contents = messages.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.text,
  }));

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...contents,
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

  const res = await fetchWithRetry(ENDPOINT, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Groq API Error: ${err || res.statusText}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

/* ─────────── JSON extraction helper ─────────── */

function extractJSON<T>(raw: string): T {
  // strip markdown fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return JSON.parse(cleaned) as T;
}

/* ═══════════════════════════════════════
   analyzePerformance
   ═══════════════════════════════════════ */

const SYSTEM_PROMPT = `You are PathAI, an expert education advisor and personalized learning coach. You analyze student performance data and create highly specific, actionable learning plans. You never give generic advice. Every recommendation is tied to the student's exact data. Always respond with valid JSON only — no markdown, no explanation, just the raw JSON object.`;

function buildAnalysisPrompt(input: StudentInput): string {
  const pct = Math.round((input.totalScore / input.maxScore) * 100);
  const topicLines = input.topics
    .map(
      (t) =>
        `- ${t.topic}: ${t.score}/${t.maxScore} (${Math.round(
          (t.score / t.maxScore) * 100
        )}%)`
    )
    .join("\n");

  return `Analyze this student's performance and return a detailed learning plan.

Subject: ${input.subject}
Overall: ${input.totalScore}/${input.maxScore} (${pct}%)
Passing marks: ${input.passingMarks ?? "N/A"}

Topic-wise performance:
${topicLines}

Common mistakes: ${input.mistakes || "Not specified"}
Mistake types: ${input.mistakeTags.join(", ") || "Not specified"}
Available study time: ${input.availableHoursPerDay} hours/day

Return EXACTLY this JSON structure (no extra keys, no markdown):
{
  "overallAssessment": "2-3 sentence honest assessment of performance",
  "strengths": ["topic1", "topic2"],
  "weakAreas": ["topic3", "topic4"],
  "priorityOrder": ["topic to study first", "topic to study second"],
  "studyResources": [
    {
      "topic": "weakest topic",
      "title": "resource name",
      "type": "video|article|book|practice",
      "description": "1 sentence on what this teaches",
      "searchQuery": "exact YouTube/Google search query to find this"
    }
  ],
  "practiceQuestions": [
    {
      "topic": "topic name",
      "question": "full question text",
      "difficulty": "easy|medium|hard",
      "hint": "one-line hint without giving away the answer"
    }
  ],
  "revisionStrategy": "specific paragraph with techniques for this student's mistake patterns",
  "weeklyPlan": [
    {
      "day": "Day 1 (Monday)",
      "focus": "topic name",
      "tasks": ["specific task 1", "specific task 2", "specific task 3"],
      "estimatedTime": "2.5 hours"
    }
  ],
  "motivationalMessage": "1 sentence, specific to their performance, not generic",
  "estimatedImprovementDays": 21
}

IMPORTANT: Provide minimum 6 studyResources covering all weak areas. Provide minimum 8 practiceQuestions spread across weak topics ordered easy to hard. The weeklyPlan must have exactly 7 days matching ${input.availableHoursPerDay} hours/day with review on Day 7.`;
}

export async function analyzePerformance(
  input: StudentInput
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(input);

  try {
    const raw = await callGemini(SYSTEM_PROMPT, prompt);
    return extractJSON<AnalysisResult>(raw);
  } catch (firstErr) {
    // Retry with stricter instruction
    try {
      const retryPrompt =
        prompt +
        "\n\nIMPORTANT: Return ONLY raw JSON. No backticks, no markdown fences, no explanation text.";
      const raw2 = await callGemini(SYSTEM_PROMPT, retryPrompt);
      return extractJSON<AnalysisResult>(raw2);
    } catch {
      if (
        firstErr instanceof TypeError ||
        (firstErr instanceof Error && firstErr.message.includes("fetch"))
      ) {
        throw new Error(
          "Unable to reach AI. Check your API key or internet connection."
        );
      }
      throw firstErr;
    }
  }
}

/* ═══════════════════════════════════════
   comparePerformance (retake mode)
   ═══════════════════════════════════════ */

export async function comparePerformance(
  previous: StudentInput,
  current: StudentInput
): Promise<ComparisonResult> {
  const prevPct = Math.round(
    (previous.totalScore / previous.maxScore) * 100
  );
  const currPct = Math.round(
    (current.totalScore / current.maxScore) * 100
  );

  const prevTopics = previous.topics
    .map(
      (t) =>
        `- ${t.topic}: ${t.score}/${t.maxScore} (${Math.round(
          (t.score / t.maxScore) * 100
        )}%)`
    )
    .join("\n");

  const currTopics = current.topics
    .map(
      (t) =>
        `- ${t.topic}: ${t.score}/${t.maxScore} (${Math.round(
          (t.score / t.maxScore) * 100
        )}%)`
    )
    .join("\n");

  const prompt = `Compare this student's two attempts and generate an updated learning plan.

PREVIOUS ATTEMPT:
Subject: ${previous.subject}
Overall: ${previous.totalScore}/${previous.maxScore} (${prevPct}%)
Topics:
${prevTopics}

CURRENT ATTEMPT:
Subject: ${current.subject}
Overall: ${current.totalScore}/${current.maxScore} (${currPct}%)
Topics:
${currTopics}

Common mistakes (current): ${current.mistakes || "Not specified"}
Mistake types: ${current.mistakeTags.join(", ") || "Not specified"}
Available study time: ${current.availableHoursPerDay} hours/day

Return EXACTLY this JSON (no markdown, no backticks):
{
  "improvedTopics": ["topics that got better"],
  "stillWeakTopics": ["topics still weak"],
  "newWeakTopics": ["topics that got worse"],
  "overallChange": "improved|same|declined",
  "changePercentage": ${currPct - prevPct},
  "progressMessage": "2-3 sentence analysis of their progress",
  "updatedPlan": {
    "overallAssessment": "...",
    "strengths": [...],
    "weakAreas": [...],
    "priorityOrder": [...],
    "studyResources": [...minimum 6],
    "practiceQuestions": [...minimum 8],
    "revisionStrategy": "...",
    "weeklyPlan": [...7 days],
    "motivationalMessage": "...",
    "estimatedImprovementDays": number
  }
}`;

  try {
    const raw = await callGemini(SYSTEM_PROMPT, prompt);
    return extractJSON<ComparisonResult>(raw);
  } catch {
    try {
      const raw2 = await callGemini(
        SYSTEM_PROMPT,
        prompt + "\n\nReturn ONLY raw JSON. No backticks."
      );
      return extractJSON<ComparisonResult>(raw2);
    } catch {
      throw new Error(
        "Unable to reach AI. Check your API key or internet connection."
      );
    }
  }
}

/* ═══════════════════════════════════════
   chatWithTutor (multi-turn)
   ═══════════════════════════════════════ */

export async function chatWithTutor(
  input: StudentInput,
  result: AnalysisResult,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `You are PathAI's personal study tutor for this student.
Subject: ${input.subject}
Weak areas: ${result.weakAreas.join(", ")}
Strong areas: ${result.strengths.join(", ")}
Common mistakes: ${input.mistakes || "Not specified"}

Rules:
- Only answer questions related to ${input.subject} or study strategies
- Keep responses under 120 words
- Use examples when explaining concepts
- Be encouraging but honest
- If asked something off-topic, redirect: "Let's stay focused on ${input.subject}! What would you like to understand better?"
- NEVER say "As an AI" or "I'm a language model"`;

  const messages: { role: "user" | "model"; text: string }[] = history.map(
    (m) => ({ role: m.role, text: m.content })
  );
  messages.push({ role: "user", text: userMessage });

  try {
    return await callGeminiMultiTurn(systemPrompt, messages);
  } catch {
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}

/* ═══════════════════════════════════════
   analyzeMarksheetImage (Grok Vision)
   ═══════════════════════════════════════ */

const MARKSHEET_PROMPT = `You are PathAI's marksheet reader. Analyze this marksheet/result slip/answer sheet image carefully.

Extract ALL information you can find and return ONLY this JSON structure:

{
  "subject": "detected subject name or 'General' if multiple/unclear",
  "totalScore": number,
  "maxScore": number,
  "passingMarks": number or null,
  "topics": [
    { "topic": "topic/subject name", "score": number, "maxScore": number }
  ],
  "mistakes": "",
  "mistakeTags": [],
  "availableHoursPerDay": 3
}

Rules:
- If you see multiple subjects, treat each subject as a "topic" and sum total scores.
- If you can only see the total/overall score but no topic breakdown, return an empty topics array.
- Always return valid JSON only — no markdown, no explanation, no backticks.
- Be precise with numbers. Do not guess scores.
- The output must conform exactly to the JSON shape above so it can be parsed directly.

IMPORTANT: totalScore and maxScore must always be numbers. If maxScore is not visible, default it to 100. Never return null, undefined, or 0 for maxScore.`;

export async function analyzeMarksheetImage(
  base64: string,
  mimeType: string
): Promise<{ extraction: StudentInput; analysis: AnalysisResult; input: StudentInput }> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`
            }
          },
          {
            type: 'text',
            text: MARKSHEET_PROMPT
          }
        ]
      }],
      temperature: 0.1,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq Vision API ${response.status}: ${errText || response.statusText}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;
  const clean = raw.replace(/```json|```/g, '').trim();
  const extracted: StudentInput = JSON.parse(clean);

  // Ensure defaults
  if (!extracted.mistakes) extracted.mistakes = "";
  if (!extracted.mistakeTags) extracted.mistakeTags = [];
  if (!extracted.availableHoursPerDay) extracted.availableHoursPerDay = 3;

  // Sanitize extracted data
  if (!extracted.maxScore || extracted.maxScore === 0) {
    extracted.maxScore = 100;
  }
  if (!extracted.totalScore || extracted.totalScore === 0) {
    extracted.totalScore = 0;
  }
  if (!extracted.topics || extracted.topics.length === 0) {
    extracted.topics = [];
  }
  // Fix each topic
  extracted.topics = extracted.topics.map(t => ({
    ...t,
    maxScore: t.maxScore && t.maxScore > 0 ? t.maxScore : 100,
    score: t.score || 0
  }));

  const analysis = await analyzePerformance(extracted);

  return { extraction: extracted, analysis, input: extracted };
}
