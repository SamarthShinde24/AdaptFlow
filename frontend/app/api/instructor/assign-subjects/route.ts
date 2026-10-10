import { NextRequest, NextResponse } from "next/server";

// In-memory persistence for assigned subjects across requests in server runtime
let currentAssignedSubjects: string[] = [
  "Biology & Life Sciences",
  "Computer Science & AI",
];

export async function GET() {
  return NextResponse.json({
    success: true,
    subjects: currentAssignedSubjects,
    total: currentAssignedSubjects.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawSubjects =
      body.subjects || body.subject_ids || body.subjectIds || body.assignedSubjects;
    const studentId = body.studentId || body.student_id;
    const instructorId = body.instructorId || body.instructor_id || "inst_mitchell";

    if (!rawSubjects || !Array.isArray(rawSubjects) || rawSubjects.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one subject must be assigned." },
        { status: 400 }
      );
    }

    currentAssignedSubjects = rawSubjects;

    return NextResponse.json({
      success: true,
      message: studentId
        ? `Successfully assigned ${rawSubjects.length} subjects to student.`
        : `Successfully assigned ${rawSubjects.length} curriculum subjects to Fall 2026 cohort.`,
      assignedSubjects: rawSubjects,
      subjects: rawSubjects,
      instructorId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to assign subjects" },
      { status: 500 }
    );
  }
}
