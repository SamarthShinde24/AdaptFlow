import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://adaptflow-production.up.railway.app";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file_id, material_id, title, material_title, question_count = 10, difficulty = "medium" } = body;
    const targetId = file_id || material_id;
    const targetTitle = title || material_title || "";

    if (!targetId) {
      return NextResponse.json(
        { detail: "file_id or material_id is required" },
        { status: 400 }
      );
    }

    const payload = {
      file_id: targetId,
      material_id: targetId,
      title: targetTitle,
      material_title: targetTitle,
      question_count,
      difficulty,
    };

    // Try FastAPI /api/quiz/generate
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Try v1 endpoint fallback
    }

    // Fallback to FastAPI /api/v1/quiz/generate
    try {
      const v1Response = await fetch(`${API_BASE_URL}/api/v1/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (v1Response.ok) {
        const data = await v1Response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Try GET fallback
    }

    // Final fallback to GET /api/v1/quiz/questions
    const getRes = await fetch(
      `${API_BASE_URL}/api/v1/quiz/questions?material_id=${encodeURIComponent(targetId)}&title=${encodeURIComponent(targetTitle)}&count=${question_count}&difficulty=${difficulty}`
    );
    if (getRes.ok) {
      const data = await getRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { detail: "Failed to generate quiz questions from backend" },
      { status: 502 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
