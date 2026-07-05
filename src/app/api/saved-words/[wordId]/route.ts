import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAuth } from "@/utils/require-firebase-auth";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ wordId: string }> }
) {
  const authResult = await requireFirebaseAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { wordId } = await context.params;
  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8080";

  const response = await fetch(`${backendUrl}/saved-words/${wordId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authResult!.token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ wordId: string }> }
) {
  const authResult = await requireFirebaseAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { wordId } = await context.params;
  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8080";
  const body = await req.json();

  const response = await fetch(`${backendUrl}/saved-words/${wordId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authResult!.token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
