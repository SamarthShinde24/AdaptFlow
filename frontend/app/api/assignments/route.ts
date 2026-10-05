import { NextRequest, NextResponse } from "next/server";
import { Assignment } from "@/lib/types";

// In-memory task assignment store for Next.js runtime
let mockTaskAssignments: Assignment[] = [
  {
    id: "asg_task_1",
    title: "RAG Pipeline Latency & Chunking Analysis",
    instructions:
      "Benchmark chunk sizes of 256, 512, and 1024 tokens against retrieval precision. Submit a detailed summary report explaining the trade-offs in query latency vs synthesis accuracy, and include recommendations for production deployments.",
    instructorId: "inst_mitchell",
    instructorName: "Prof. Sarah Mitchell",
    course: "Computer Science & AI",
    assignedStudentIds: [
      "student_demo_1",
      "std_2",
      "std_3",
      "std_4",
      "std_5",
      "std_6",
      "std_7",
      "std_8",
    ],
    assignedToLabel: "All Students (8)",
    acceptedFileTypes: ["PDF", "DOCX"],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days -> Due Soon (Amber)
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [
      {
        studentId: "std_2",
        studentName: "Sophia Martinez",
        studentEmail: "sophia.m@adaptflow.edu",
        status: "submitted",
        submittedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        fileName: "sophia_rag_chunking_report.pdf",
        fileSizeBytes: 1450000,
        fileUrl: "/downloads/sophia_rag_chunking_report.pdf",
      },
      {
        studentId: "std_3",
        studentName: "Marcus Vance",
        studentEmail: "m.vance@adaptflow.edu",
        status: "submitted",
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        fileName: "marcus_vance_latency_analysis.docx",
        fileSizeBytes: 890000,
        fileUrl: "/downloads/marcus_vance_latency_analysis.docx",
      },
    ],
  },
  {
    id: "asg_task_2",
    title: "Cellular Respiration & Net ATP Synthesis Paper",
    instructions:
      "Analyze oxidative phosphorylation and compute the stoichiometric net ATP yield per glucose molecule under aerobic conditions. Include a diagram or flow chart illustrating the proton gradient across the inner mitochondrial membrane.",
    instructorId: "inst_chen",
    instructorName: "Dr. Robert Chen",
    course: "Biology & Life Sciences",
    assignedStudentIds: ["student_demo_1", "std_4", "std_5", "std_7"],
    assignedToLabel: "Honors Biology Cohort (4)",
    acceptedFileTypes: ["PDF", "PPT", "DOCX"],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days -> Green
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [],
  },
  {
    id: "asg_task_3",
    title: "Vector Embeddings Distance Metric Comparison",
    instructions:
      "Compare Cosine Similarity, Dot Product, and Euclidean distance across normalized embeddings. Provide empirical observations on retrieval reranking performance with sample queries and document chunks.",
    instructorId: "inst_mitchell",
    instructorName: "Prof. Sarah Mitchell",
    course: "Computer Science & AI",
    assignedStudentIds: ["student_demo_1", "std_2", "std_6"],
    assignedToLabel: "Selected Students (3)",
    acceptedFileTypes: ["PDF", "TXT"],
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Overdue -> Red
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [],
  },
  {
    id: "asg_task_4",
    title: "Bioenergetics Literature Review: Chemiosmosis",
    instructions:
      "Review Peter Mitchell's chemiosmotic hypothesis and summarize experimental validations using reconstituted vesicle systems and ATP synthase reconstitution experiments.",
    instructorId: "inst_chen",
    instructorName: "Dr. Robert Chen",
    course: "Biology & Life Sciences",
    assignedStudentIds: ["student_demo_1", "std_3", "std_5"],
    assignedToLabel: "Selected Students (3)",
    acceptedFileTypes: ["PDF", "DOCX"],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [
      {
        studentId: "student_demo_1",
        studentName: "Alex Rivera",
        studentEmail: "alex.rivera@adaptflow.edu",
        status: "submitted",
        submittedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        fileName: "alex_rivera_chemiosmosis_review.pdf",
        fileSizeBytes: 2120000,
        fileUrl: "/downloads/alex_rivera_chemiosmosis_review.pdf",
      },
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("student_id") || "student_demo_1";
    const instructorId = searchParams.get("instructor_id");

    const now = new Date().getTime();

    // Map each assignment to include student-specific computed status
    const mapped = mockTaskAssignments.map((assignment) => {
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
      instructions: instructions || "Review the course materials and upload your completed task submission file before the deadline.",
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

    mockTaskAssignments.unshift(newAssignment);

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

    const index = mockTaskAssignments.findIndex((a) => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    mockTaskAssignments[index] = {
      ...mockTaskAssignments[index],
      ...updates,
    };

    return NextResponse.json({
      success: true,
      message: "Assignment updated successfully",
      assignment: mockTaskAssignments[index],
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

    mockTaskAssignments = mockTaskAssignments.filter((a) => a.id !== id);

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

// Export memory store getter/updater for submit endpoint
export function getMockAssignments() {
  return mockTaskAssignments;
}

export function updateMockAssignmentSubmission(
  assignmentId: string,
  submission: {
    studentId: string;
    studentName: string;
    studentEmail?: string;
    fileName: string;
    fileSizeBytes: number;
    fileUrl?: string;
  }
) {
  const index = mockTaskAssignments.findIndex((a) => a.id === assignmentId);
  if (index === -1) return null;

  const existingSubIndex = mockTaskAssignments[index].submissions.findIndex(
    (s) => s.studentId === submission.studentId
  );

  const newSub = {
    ...submission,
    status: "submitted" as const,
    submittedAt: new Date().toISOString(),
  };

  if (existingSubIndex >= 0) {
    mockTaskAssignments[index].submissions[existingSubIndex] = newSub;
  } else {
    mockTaskAssignments[index].submissions.push(newSub);
  }

  return mockTaskAssignments[index];
}
