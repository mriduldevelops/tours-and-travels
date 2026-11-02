import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";
import { getCurrentUser } from "@/lib/auth";

function isAdmin(user) {
  return user?.role === "admin";
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

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid package ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    await connectDB();

    const updateData = {};

    const allowedFields = [
      "title",
      "destination",
      "category",
      "duration",
      "description",
      "featured",
      "active",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (body.price !== undefined) {
      updateData.price = Number(body.price);
    }

    if (body.originalPrice !== undefined) {
      updateData.originalPrice = Number(body.originalPrice);
    }

    if (body.images !== undefined) {
      updateData.images = splitLines(body.images);
    }

    if (body.inclusions !== undefined) {
      updateData.inclusions = splitLines(body.inclusions);
    }

    if (body.exclusions !== undefined) {
      updateData.exclusions = splitLines(body.exclusions);
    }

    if (body.itinerary !== undefined) {
      updateData.itinerary = Array.isArray(body.itinerary)
        ? body.itinerary
        : [];
    }

    if (body.title) {
      const slugBase = body.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      let slug = slugBase;
      let counter = 1;

      while (
        await Package.exists({
          slug,
          _id: { $ne: id },
        })
      ) {
        slug = `${slugBase}-${counter}`;
        counter++;
      }

      updateData.slug = slug;
    }

    const updatedPackage = await Package.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPackage) {
      return NextResponse.json(
        { message: "Package not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Package updated successfully",
      package: updatedPackage,
    });
  } catch (error) {
    console.error("PATCH package error:", error);

    return NextResponse.json(
      { message: "Failed to update package" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid package ID" },
        { status: 400 },
      );
    }

    await connectDB();

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json(
        { message: "Package not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("DELETE package error:", error);

    return NextResponse.json(
      { message: "Failed to delete package" },
      { status: 500 },
    );
  }
}
