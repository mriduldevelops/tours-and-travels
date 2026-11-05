import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Booking from "@/models/Booking";

const allowedStatuses = {
  paymentStatus: ["created", "pending", "unpaid", "paid", "failed", "refunded"],
  bookingStatus: ["pending", "confirmed", "cancelled"],
};

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (user?.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 },
      );
    }

    await connectDB();

    const bookings = await Booking.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        ...booking,
        _id: String(booking._id),
        package: String(booking.package),
        user: booking.user
          ? {
              _id: String(booking.user._id),
              name: booking.user.name,
              email: booking.user.email,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Admin bookings error:", error);

    return NextResponse.json(
      { message: "Failed to load bookings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();

    if (user?.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const { bookingId, field, value } = body;

    if (
      typeof bookingId !== "string" ||
      !mongoose.Types.ObjectId.isValid(bookingId)
    ) {
      return NextResponse.json(
        { message: "A valid booking ID is required" },
        { status: 400 },
      );
    }

    if (
      !Object.hasOwn(allowedStatuses, field) ||
      !allowedStatuses[field].includes(value)
    ) {
      return NextResponse.json(
        { message: "Invalid booking or payment status" },
        { status: 400 },
      );
    }

    await connectDB();

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { [field]: value } },
      { new: true, runValidators: true },
    ).select("paymentStatus bookingStatus");

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      booking: {
        _id: String(booking._id),
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
      },
    });
  } catch (error) {
    console.error("Admin booking update error:", error);

    return NextResponse.json(
      { message: "Failed to update booking" },
      { status: 500 },
    );
  }
}
