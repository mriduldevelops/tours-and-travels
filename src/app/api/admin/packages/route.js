
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";
import { getCurrentUser } from "@/lib/auth";
import { isValidFutureTripDate } from "@/lib/trip-date";

// Convert text into a URL-friendly slug
function createSlug(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize and validate package data
function normalizePackageBody(body = {}) {
  return {
    title: String(body.title || "").trim(),
    slug: createSlug(body.slug || body.title || ""),
    destination: String(body.destination || "").trim(),
    category: String(body.category || "").trim(),
    duration: String(body.duration || "").trim(),
    tripDate: String(body.tripDate || "").trim(),

    price: Number(body.price || 0),
    originalPrice:
      body.originalPrice === "" ||
      body.originalPrice === null ||
      body.originalPrice === undefined
        ? 0
        : Number(body.originalPrice),

    description: String(body.description || "").trim(),

    images: Array.isArray(body.images)
      ? body.images.map((item) => String(item).trim()).filter(Boolean)
      : [],

    highlights: Array.isArray(body.highlights)
      ? body.highlights.map((item) => String(item).trim()).filter(Boolean)
      : [],

    itinerary: Array.isArray(body.itinerary)
      ? body.itinerary
          .map((item, index) => ({
            day: Number(item.day) || index + 1,
            title: String(item.title || "").trim(),
            description: String(item.description || "").trim(),
          }))
          .filter((item) => item.title || item.description)
      : [],

    inclusions: Array.isArray(body.inclusions)
      ? body.inclusions.map((item) => String(item).trim()).filter(Boolean)
      : [],

    exclusions: Array.isArray(body.exclusions)
      ? body.exclusions.map((item) => String(item).trim()).filter(Boolean)
      : [],

    featured: Boolean(body.featured),
    active: body.active !== false,
  };
}

// GET: Fetch all packages
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    const packages = await Package.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        packages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET packages error:", error);

    return NextResponse.json(
      { message: "Failed to fetch packages." },
      { status: 500 }
    );
  }
}

// POST: Create a new package
export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const packageData = normalizePackageBody(body);

    // Required field validation
    if (
      !packageData.title ||
      !packageData.destination ||
      !packageData.category ||
      !packageData.duration ||
      !packageData.tripDate ||
      !packageData.description
    ) {
      return NextResponse.json(
        {
          message:
            "Title, destination, category, duration, trip date, and description are required.",
        },
        { status: 400 }
      );
    }

    if (!isValidFutureTripDate(packageData.tripDate)) {
      return NextResponse.json(
        { message: "Trip date must be a valid date today or later." },
        { status: 400 }
      );
    }

    if (!packageData.slug) {
      return NextResponse.json(
        { message: "A valid package slug is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(packageData.price) ||
      packageData.price <= 0
    ) {
      return NextResponse.json(
        { message: "Package price must be greater than zero." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(packageData.originalPrice) ||
      packageData.originalPrice < 0
    ) {
      return NextResponse.json(
        { message: "Original price must be a valid non-negative number." },
        { status: 400 }
      );
    }

    if (
      packageData.originalPrice > 0 &&
      packageData.originalPrice < packageData.price
    ) {
      return NextResponse.json(
        { message: "Original price cannot be less than the package price." },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPackage = await Package.findOne({
      slug: packageData.slug,
    });

    if (existingPackage) {
      return NextResponse.json(
        { message: "A package with this slug already exists." },
        { status: 409 }
      );
    }

    const newPackage = await Package.create(packageData);

    return NextResponse.json(
      {
        success: true,
        message: "Package created successfully.",
        package: newPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST package error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A package with this slug already exists." },
        { status: 409 }
      );
    }

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create package." },
      { status: 500 }
    );
  }
}
