import { Assignment } from "@/lib/types";

// In-memory task assignment store for Next.js runtime
export let mockTaskAssignments: Assignment[] = [
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
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
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
        fileSizeBytes: 980000,
        fileUrl: "/downloads/marcus_vance_latency_analysis.docx",
      },
    ],
  },
  {
    id: "asg_task_2",
    title: "Cellular Respiration & Krebs Cycle Breakdown",
    instructions:
      "Diagram the complete Krebs cycle illustrating acetyl-CoA oxidation, ATP/GTP yield, and NADH/FADH2 electron carrier generation. Annotate all enzyme catalysts and control checkpoints.",
    instructorId: "inst_mitchell",
    instructorName: "Prof. Sarah Mitchell",
    course: "Biology & Life Sciences",
    assignedStudentIds: [
      "student_demo_1",
      "std_2",
      "std_3",
      "std_4",
      "std_5",
      "std_6",
    ],
    assignedToLabel: "Biology Cohort (6)",
    acceptedFileTypes: ["PDF", "PPT"],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [
      {
        studentId: "std_2",
        studentName: "Sophia Martinez",
        studentEmail: "sophia.m@adaptflow.edu",
        status: "submitted",
        submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        fileName: "krebs_diagram_sophia.pdf",
        fileSizeBytes: 2100000,
        fileUrl: "/downloads/krebs_diagram_sophia.pdf",
      },
    ],
  },
  {
    id: "asg_task_3",
    title: "Thermodynamics & Carnot Cycle Efficiency Analysis",
    instructions:
      "Derive the Carnot efficiency theorem starting from Kelvin-Planck and Clausius statements of the second law. Calculate total entropy generation across irreversible expansion processes.",
    instructorId: "inst_mitchell",
    instructorName: "Prof. Sarah Mitchell",
    course: "Thermodynamics",
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
    acceptedFileTypes: ["PDF", "TXT"],
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [],
  },
  {
    id: "asg_task_4",
    title: "Binary Search Tree Rebalancing Proof",
    instructions:
      "Provide formal proofs for AVL tree height boundedness and rotation invariance. Implement and submit annotated pseudo-code demonstrating LR and RL double-rotations with complexity analysis.",
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
    acceptedFileTypes: ["PDF", "DOCX", "TXT"],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [],
  },
];

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
