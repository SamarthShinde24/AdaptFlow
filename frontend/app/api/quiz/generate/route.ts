import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file_id, question_count = 10 } = body;

    if (!file_id) {
      return NextResponse.json(
        { detail: "file_id is required" },
        { status: 400 }
      );
    }

    // Try FastAPI /api/quiz/generate
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id, question_count }),
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
        body: JSON.stringify({ file_id, question_count }),
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
      `${API_BASE_URL}/api/v1/quiz/questions?material_id=${file_id}&count=${question_count}`
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
