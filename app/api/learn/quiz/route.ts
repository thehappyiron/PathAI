import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { topic, subject, standard, difficulty, count, isFinalTest } = await req.json();
    if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 });

    const numQ = count || (isFinalTest ? 18 : 10);
    const diff = difficulty || "medium";

    const prompt = `You are a strict Indian exam paper setter for ${standard || "school"} level.
Generate exactly ${numQ} multiple-choice questions on "${topic}" (${subject || "General"}).
Difficulty: ${diff}${isFinalTest ? " (this is a final comprehensive test)" : ""}.

Return a JSON array with this exact structure:
[
  {
    "id": 1,
    "question": "The question text",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

Rules:
- correctAnswer is the 0-based index of the correct option
- Questions should be NCERT/CBSE aligned
- Mix conceptual and application-based questions
- Return ONLY valid JSON array, no markdown`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq quiz error:", err);
      return NextResponse.json({ error: "Quiz generation failed" }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });

    const questions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error("Quiz API error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
