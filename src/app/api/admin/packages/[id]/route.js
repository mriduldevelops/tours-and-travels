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

// GET: Fetch a single package
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    await connectDB();

    const { id } = await params;

    const packageItem = await Package.findById(id).lean();

    if (!packageItem) {
      return NextResponse.json(
        { message: "Package not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        package: packageItem,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET package by ID error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { message: "Invalid package ID." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch package." },
      { status: 500 },
    );
  }
}

// PATCH: Update an existing package
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const existingPackage = await Package.findById(id);

    if (!existingPackage) {
      return NextResponse.json(
        { message: "Package not found." },
        { status: 404 },
      );
    }

    const packageData = normalizePackageBody({
      ...existingPackage.toObject(),
      ...body,
    });

    if (
      body.tripDate !== undefined &&
      !isValidFutureTripDate(packageData.tripDate)
    ) {
      return NextResponse.json(
        { message: "Trip date must be a valid date today or later." },
        { status: 400 },
      );
    }

    // Required field validation
    if (
      !packageData.title ||
      !packageData.destination ||
      !packageData.category ||
      !packageData.duration ||
      !packageData.description
    ) {
      return NextResponse.json(
        {
          message:
            "Title, destination, category, duration, and description are required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(packageData.price) || packageData.price <= 0) {
      return NextResponse.json(
        { message: "Package price must be greater than zero." },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(packageData.originalPrice) ||
      packageData.originalPrice < 0
    ) {
      return NextResponse.json(
        { message: "Original price must be a valid non-negative number." },
        { status: 400 },
      );
    }

    if (
      packageData.originalPrice > 0 &&
      packageData.originalPrice < packageData.price
    ) {
      return NextResponse.json(
        { message: "Original price cannot be less than the package price." },
        { status: 400 },
      );
    }

    // Check slug uniqueness, excluding the current package
    const slugExists = await Package.findOne({
      slug: packageData.slug,
      _id: { $ne: id },
    });

    if (slugExists) {
      return NextResponse.json(
        { message: "A package with this slug already exists." },
        { status: 409 },
      );
    }

    const updatedPackage = await Package.findByIdAndUpdate(id, packageData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Package updated successfully.",
        package: updatedPackage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH package error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A package with this slug already exists." },
        { status: 409 },
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        { message: "Invalid package ID." },
        { status: 400 },
      );
    }

    if (error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Failed to update package." },
      { status: 500 },
    );
  }
}

// DELETE: Delete a package
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    await connectDB();

    const { id } = await params;

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json(
        { message: "Package not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Package deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE package error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        { message: "Invalid package ID." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to delete package." },
      { status: 500 },
    );
  }
}
