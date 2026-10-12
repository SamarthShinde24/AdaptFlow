import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  return NextResponse.json({
    success: true,
    message: `Material ${id} deleted successfully.`,
    data: { id },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  return NextResponse.json({
    success: true,
    data: { id },
  });
}
