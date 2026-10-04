import { NextResponse } from "next/server";

export async function GET() {
  const subjects = [
    {
      id: "sub_bio",
      name: "Biology & Life Sciences",
      code: "BIO101",
      description: "Cellular respiration, genetics, and molecular biology.",
    },
    {
      id: "sub_cs",
      name: "Computer Science & AI",
      code: "CS201",
      description: "Data structures, algorithms, neural networks, and Python.",
    },
    {
      id: "sub_chem",
      name: "Organic Chemistry",
      code: "CHEM301",
      description: "Stereochemistry, reaction mechanisms, and spectroscopy.",
    },
    {
      id: "sub_phys",
      name: "Physics & Mechanics",
      code: "PHYS102",
      description: "Thermodynamics, kinematics, electrodynamics, and optics.",
    },
    {
      id: "sub_hist",
      name: "World History & Heritage",
      code: "HIST110",
      description: "Urban architecture, global civilizations, and cultural evolution.",
    },
    {
      id: "sub_math",
      name: "Calculus & Linear Algebra",
      code: "MATH205",
      description: "Multivariable calculus, vector spaces, and eigenvalues.",
    },
  ];

  return NextResponse.json({ subjects });
}
