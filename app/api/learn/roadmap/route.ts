import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { topic, subject, standard } = await req.json();
    if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 });

    const prompt = `You are an expert Indian education tutor. Generate a detailed learning roadmap for a ${standard || ""} student studying "${topic}" under "${subject || "General"}".

Return a JSON object with exactly this structure:
{
  "title": "Topic name",
  "overview": "2-3 sentence overview of what this topic covers",
  "prerequisites": ["list of prerequisite topics they should know"],
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "What to learn in this step (2-3 sentences)",
      "duration": "Estimated time like '30 mins' or '1 hour'",
      "tips": "A helpful tip for this step"
    }
  ],
  "keyFormulas": ["Important formulas or key facts (if applicable)"],
  "commonMistakes": ["Common mistakes students make"],
  "examTips": ["Tips for answering exam questions on this topic"]
}

Provide 5-8 steps. Be specific to the Indian curriculum (NCERT/CBSE). Return ONLY valid JSON, no markdown.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq roadmap error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Extract JSON from possible markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });

    const roadmap = JSON.parse(jsonMatch[0]);
    return NextResponse.json(roadmap);
  } catch (err: any) {
    console.error("Roadmap API error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
