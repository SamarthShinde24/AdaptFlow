import { NextResponse } from "next/server";
import { EnrolledStudent } from "@/lib/types";

const mockStudents: EnrolledStudent[] = [
  {
    id: "student_demo_1",
    name: "Alex Rivera",
    email: "alex.rivera@adaptflow.edu",
    course: "Computer Science & AI",
    grade: "A-",
  },
  {
    id: "std_2",
    name: "Sophia Martinez",
    email: "sophia.m@adaptflow.edu",
    course: "Computer Science & AI",
    grade: "B+",
  },
  {
    id: "std_3",
    name: "Marcus Vance",
    email: "m.vance@adaptflow.edu",
    course: "Computer Science & AI",
    grade: "A",
  },
  {
    id: "std_4",
    name: "Elena Rostova",
    email: "elena.r@adaptflow.edu",
    course: "Biology & Life Sciences",
    grade: "A",
  },
  {
    id: "std_5",
    name: "Liam Patel",
    email: "liam.p@adaptflow.edu",
    course: "Biology & Life Sciences",
    grade: "B",
  },
  {
    id: "std_6",
    name: "Chloe Dupont",
    email: "c.dupont@adaptflow.edu",
    course: "Computer Science & AI",
    grade: "A-",
  },
  {
    id: "std_7",
    name: "David Kim",
    email: "david.kim@adaptflow.edu",
    course: "Bioenergetics",
    grade: "B+",
  },
  {
    id: "std_8",
    name: "Aisha Al-Mansoor",
    email: "aisha.m@adaptflow.edu",
    course: "Computer Science & AI",
    grade: "A+",
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    total: mockStudents.length,
    students: mockStudents,
  });
}
