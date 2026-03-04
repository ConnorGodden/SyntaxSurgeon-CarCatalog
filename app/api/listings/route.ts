import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { make, model, year, rating } = await req.json();

    if (!make || !model || !year || !rating) {
      return NextResponse.json(
        { error: "make, model, year, and rating are required" },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "public", "cars.csv");

    let content = await fs.readFile(filePath, "utf8");

    if (!content.endsWith("\n")) {
      content += "\n";
    }

    const sanitized = [make, model, year, rating].map((value) =>
      String(value).replace(/\r?\n/g, " ").trim()
    );

    content += `${sanitized.join(",")}\n`;

    await fs.writeFile(filePath, content, "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}

