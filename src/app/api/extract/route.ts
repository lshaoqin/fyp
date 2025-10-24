import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { extractTextFromImage } from "../../../helpers/ocr";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tmpDir = os.tmpdir();
  const originalName = file.name ?? `upload`;
  const filePath = path.join(tmpDir, `${Date.now()}-${originalName}`);

    await fs.promises.writeFile(filePath, buffer);

    try {
      const text = await extractTextFromImage(filePath);
      return NextResponse.json({ text });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    } finally {
      try {
        await fs.promises.unlink(filePath);
      } catch {
        // ignore cleanup errors
      }
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
