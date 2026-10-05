import { NextRequest, NextResponse } from "next/server";
import { updateMockAssignmentSubmission } from "@/app/api/assignments/route";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const assignmentId = formData.get("assignmentId") as string;
    const file = formData.get("file") as File | null;
    const studentId = (formData.get("studentId") as string) || "student_demo_1";
    const studentName = (formData.get("studentName") as string) || "Alex Rivera";
    const studentEmail = (formData.get("studentEmail") as string) || "alex.rivera@adaptflow.edu";

    if (!assignmentId || !file) {
      return NextResponse.json(
        { error: "Both assignmentId and file are required." },
        { status: 400 }
      );
    }

    const updatedAssignment = updateMockAssignmentSubmission(assignmentId, {
      studentId,
      studentName,
      studentEmail,
      fileName: file.name,
      fileSizeBytes: file.size,
      fileUrl: `/downloads/${file.name}`,
    });

    if (!updatedAssignment) {
      return NextResponse.json(
        { error: `Assignment with id ${assignmentId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `File "${file.name}" successfully uploaded and submitted!`,
      assignment: updatedAssignment,
      submission: {
        fileName: file.name,
        fileSizeBytes: file.size,
        submittedAt: new Date().toISOString(),
        status: "submitted",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit assignment file." },
      { status: 500 }
    );
  }
}
