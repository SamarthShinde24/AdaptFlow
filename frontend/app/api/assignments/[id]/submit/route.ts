import { NextRequest, NextResponse } from "next/server";
import { updateMockAssignmentSubmission } from "@/lib/assignments-store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    let fileName = "submission.pdf";
    let fileSizeBytes = 1024000;
    let studentId = "student_demo_1";
    let studentName = "Alex Rivera";
    let studentEmail = "alex.rivera@adaptflow.edu";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (file) {
          fileName = file.name;
          fileSizeBytes = file.size;
        }
        studentId = (formData.get("studentId") as string) || studentId;
        studentName = (formData.get("studentName") as string) || studentName;
        studentEmail = (formData.get("studentEmail") as string) || studentEmail;
      } catch (parseErr) {
        console.warn("Failed to parse formData body, using fallback values:", parseErr);
      }
    } else {
      // JSON body fallback
      const body = await req.json().catch(() => ({}));
      fileName = body.fileName || fileName;
      fileSizeBytes = body.fileSizeBytes || fileSizeBytes;
      studentId = body.studentId || studentId;
      studentName = body.studentName || studentName;
      studentEmail = body.studentEmail || studentEmail;
    }

    const updatedAssignment = updateMockAssignmentSubmission(assignmentId, {
      studentId,
      studentName,
      studentEmail,
      fileName,
      fileSizeBytes,
      fileUrl: `/downloads/${fileName}`,
    });

    const submissionPayload = {
      studentId,
      studentName,
      studentEmail,
      fileName,
      fileSizeBytes,
      submittedAt: new Date().toISOString(),
      status: "submitted" as const,
      fileUrl: `/downloads/${fileName}`,
    };

    return NextResponse.json(
      {
        success: true,
        message: `File "${fileName}" successfully uploaded and submitted!`,
        assignment: updatedAssignment || {
          id: assignmentId,
          submissions: [submissionPayload],
        },
        submission: submissionPayload,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err: any) {
    console.error("Error submitting assignment:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to submit assignment file.",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
