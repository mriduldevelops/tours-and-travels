import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Package not found" },
        { status: 404 },
      );
    }

    await connectDB();

    const packageItem = await Package.findOne({
      _id: id,
      active: true,
    }).lean();

    if (!packageItem) {
      return NextResponse.json(
        { message: "Package not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ package: packageItem });
  } catch (error) {
    console.error("GET public package error:", error);

    return NextResponse.json(
      { message: "Failed to fetch package" },
      { status: 500 },
    );
  }
}
