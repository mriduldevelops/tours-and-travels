import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid package ID" },
        { status: 400 },
      );
    }

    await connectDB();

    const travelPackage = await Package.findOne({
      _id: id,
      active: true,
    }).lean();

    if (!travelPackage) {
      return NextResponse.json(
        { message: "Package not found" },
        { status: 404 },
      );
    }

    const packageData = {
      ...travelPackage,
      _id: String(travelPackage._id),
      category: travelPackage.category || "Adventure",
      images: Array.isArray(travelPackage.images) ? travelPackage.images : [],
      highlights: Array.isArray(travelPackage.highlights)
        ? travelPackage.highlights
        : [],
      itinerary: Array.isArray(travelPackage.itinerary)
        ? travelPackage.itinerary
        : [],
      inclusions: Array.isArray(travelPackage.inclusions)
        ? travelPackage.inclusions
        : [],
      exclusions: Array.isArray(travelPackage.exclusions)
        ? travelPackage.exclusions
        : [],
      featured: Boolean(travelPackage.featured),
      active: Boolean(travelPackage.active),
    };

    return NextResponse.json({ package: packageData });
  } catch (error) {
    console.error("Public package API error:", error);

    return NextResponse.json(
      { message: "Unable to load package" },
      { status: 500 },
    );
  }
}
