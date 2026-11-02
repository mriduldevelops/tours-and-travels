import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";
import { getCurrentUser } from "@/lib/auth";

function isAdmin(user) {
  return user?.role === "admin";
}

function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitLines(value) {
  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 },
      );
    }

    await connectDB();

    const packages = await Package.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("GET packages error:", error);

    return NextResponse.json(
      { message: "Failed to fetch packages" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      title,
      destination,
      category,
      duration,
      price,
      originalPrice,
      description,
      images,
      itinerary,
      inclusions,
      exclusions,
      featured,
      active,
    } = body;

    if (
      !title?.trim() ||
      !destination?.trim() ||
      !duration?.trim() ||
      !description?.trim() ||
      price === undefined ||
      Number(price) < 0
    ) {
      return NextResponse.json(
        { message: "Please fill all required fields correctly" },
        { status: 400 },
      );
    }

    await connectDB();

    let slug = createSlug(title);
    let uniqueSlug = slug;
    let counter = 1;

    while (await Package.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const newPackage = await Package.create({
      title: title.trim(),
      slug: uniqueSlug,
      destination: destination.trim(),
      category: category || "Adventure",
      duration: duration.trim(),
      price: Number(price),
      originalPrice: Number(originalPrice || 0),
      description: description.trim(),
      images: splitLines(images),
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      inclusions: splitLines(inclusions),
      exclusions: splitLines(exclusions),
      featured: Boolean(featured),
      active: active !== false,
    });

    return NextResponse.json(
      {
        message: "Package created successfully",
        package: newPackage,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST package error:", error);

    return NextResponse.json(
      { message: "Failed to create package" },
      { status: 500 },
    );
  }
}
