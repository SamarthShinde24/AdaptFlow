import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = (params?.id || "").toLowerCase();

  // Resolve matching static upload file
  if (
    id === "aa50916b-eedc-4306-a820-f96a7fce57f6" ||
    id.includes("rag") ||
    id.includes("video") ||
    id.includes("vidssave")
  ) {
    return NextResponse.redirect(new URL("/uploads/rag_explained.mp4", request.url));
  }

  if (
    id === "mat_2" ||
    id.includes("jaipur") ||
    id.includes("c89b6ec3")
  ) {
    return NextResponse.redirect(new URL("/uploads/jaipur_guide.pdf", request.url));
  }

  if (
    id === "mat_1" ||
    id.includes("bio") ||
    id.includes("biology")
  ) {
    return NextResponse.redirect(new URL("/uploads/principles_of_biology.pdf", request.url));
  }

  // Default to biology textbook
  return NextResponse.redirect(new URL("/uploads/principles_of_biology.pdf", request.url));
}
