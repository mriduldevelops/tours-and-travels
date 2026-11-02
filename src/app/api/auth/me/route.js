import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const payload = await getCurrentUser();

    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.userId).select("name email role");

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Current user error:", error);

    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const payload = await getCurrentUser();

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required." },
        { status: 400 },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { message: "Name must be 100 characters or fewer." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { $set: { name, email } },
      { new: true, runValidators: true },
    ).select("name email role");

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "That email address is already in use." },
        { status: 409 },
      );
    }

    console.error("Profile update error:", error);

    return NextResponse.json(
      { message: "Unable to update your profile." },
      { status: 500 },
    );
  }
}
