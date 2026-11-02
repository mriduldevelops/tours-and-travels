import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in" }, { status: 401 });
    }

    await connectDB();

    const bookings = await Booking.find({
      user: user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        ...booking,
        _id: String(booking._id),
        package: String(booking.package),
        user: String(booking.user),
      })),
    });
  } catch (error) {
    console.error("My bookings API error:", error);

    return NextResponse.json(
      { message: "Unable to load bookings" },
      { status: 500 },
    );
  }
}
