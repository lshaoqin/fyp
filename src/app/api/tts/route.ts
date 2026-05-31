import { NextResponse } from "next/server";
import { requireFirebaseAuth } from "@/utils/require-firebase-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authResult = await requireFirebaseAuth(req, true);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { text, voice } = body;

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Forward the request to the Python backend
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8080";

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authResult?.token) {
        headers["Authorization"] = `Bearer ${authResult!.token}`;
      }

      const response = await fetch(`${backendUrl}/tts`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          text,
          voice: voice || "af_heart",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: errorText || "Failed to generate audio" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to connect to backend: ${String(err)}` },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
