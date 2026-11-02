import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";

export async function GET() {
  try {
    await connectDB();

    const packages = await Package.find({ active: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("GET public packages error:", error);

    return NextResponse.json(
      { message: "Failed to fetch packages" },
      { status: 500 },
    );
  }
}
