import { NextRequest, NextResponse } from "next/server";
import { Assignment } from "@/lib/types";
import {
  getMockAssignments,
  createMockAssignment,
  updateMockAssignment,
  deleteMockAssignment,
} from "@/lib/assignments-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("student_id") || "student_demo_1";
    const instructorId = searchParams.get("instructor_id");

    const now = new Date().getTime();
    const allAssignments = getMockAssignments();

    // Map each assignment to include student-specific computed status
    const mapped = allAssignments.map((assignment) => {
      const mySub = assignment.submissions.find((s) => s.studentId === studentId);
      const isDuePast = new Date(assignment.dueDate).getTime() < now;

      let studentStatus: "submitted" | "overdue" | "pending" = "pending";
      if (mySub && mySub.status === "submitted") {
        studentStatus = "submitted";
      } else if (isDuePast) {
        studentStatus = "overdue";
      } else {
        studentStatus = "pending";
      }

      return {
        ...assignment,
        mySubmission: mySub || null,
        studentStatus,
        status: studentStatus,
      };
    });

    let filtered = mapped;

    if (instructorId) {
      filtered = mapped.filter(
        (a) =>
          !a.instructorId ||
          a.instructorId === instructorId ||
          instructorId === "instructor_demo" ||
          instructorId.startsWith("usr_")
      );
    }

    return NextResponse.json({
      success: true,
      total: filtered.length,
      assignments: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load assignments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      instructions,
      course,
      assignedStudentIds = ["student_demo_1"],
      acceptedFileTypes = ["PDF", "DOCX"],
      dueDate,
      instructorId = "inst_mitchell",
      instructorName = "Prof. Sarah Mitchell",
    } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields: title and dueDate are required." },
        { status: 400 }
      );
    }

    const newAssignment: Assignment = {
      id: `asg_${Date.now()}`,
      title,
      instructions:
        instructions ||
        "Review the course materials and upload your completed task submission file before the deadline.",
      instructorId,
      instructorName,
      course: course || "Computer Science & AI",
      assignedStudentIds:
        Array.isArray(assignedStudentIds) && assignedStudentIds.length > 0
          ? assignedStudentIds
          : ["student_demo_1"],
      assignedToLabel:
        Array.isArray(assignedStudentIds) && assignedStudentIds.length > 1
          ? `${assignedStudentIds.length} Selected Students`
          : "All Students (8)",
      acceptedFileTypes:
        Array.isArray(acceptedFileTypes) && acceptedFileTypes.length > 0
          ? acceptedFileTypes
          : ["PDF", "DOCX"],
      dueDate: new Date(dueDate).toISOString(),
      createdAt: new Date().toISOString(),
      submissions: [],
    };

    createMockAssignment(newAssignment);

    return NextResponse.json({
      success: true,
      message: "Assignment created successfully",
      assignment: newAssignment,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
    }

    const updated = updateMockAssignment(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Assignment updated successfully",
      assignment: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
    }

    const deleted = deleteMockAssignment(id);
    if (!deleted) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
