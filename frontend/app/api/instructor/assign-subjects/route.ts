import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instructorId, studentId, subjects } = body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: "At least one subject must be assigned." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: studentId
        ? `Successfully assigned ${subjects.length} subjects to student ${studentId}.`
        : `Successfully set default curriculum of ${subjects.length} subjects for enrolled students.`,
      assignedSubjects: subjects,
      instructorId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to assign subjects" },
      { status: 500 }
    );
  }
}
