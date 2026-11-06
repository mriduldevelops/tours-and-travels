import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Booking from "@/models/Booking";
import Package from "@/models/Package";
import { isValidFutureTripDate } from "@/lib/trip-date";

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

    const today = new Date();
    const todayString = [
      today.getUTCFullYear(),
      String(today.getUTCMonth() + 1).padStart(2, "0"),
      String(today.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const todayDate = new Date(`${todayString}T00:00:00.000Z`);

    const scheduledPackages = await Package.find({
      active: true,
      tripDate: { $gte: todayString },
    })
      .sort({ tripDate: 1, title: 1 })
      .lean();
    const packages = scheduledPackages.filter((travelPackage) =>
      isValidFutureTripDate(travelPackage.tripDate),
    );

    if (packages.length === 0) {
      return NextResponse.json({ tours: [] });
    }

    const bookings = await Booking.find({
      package: { $in: packages.map((item) => item._id) },
      travelDate: { $gte: todayDate },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const bookingsByPackage = new Map();

    for (const booking of bookings) {
      const packageId = String(booking.package);
      const packageBookings = bookingsByPackage.get(packageId) || [];

      packageBookings.push({
        _id: String(booking._id),
        user: booking.user
          ? {
              name: booking.user.name,
              email: booking.user.email,
            }
          : null,
        travelers: booking.travelers,
        totalAmount: booking.totalAmount,
        currency: booking.currency || "INR",
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      });

      bookingsByPackage.set(packageId, packageBookings);
    }

    const tours = packages.map((travelPackage) => {
      const packageBookings =
        bookingsByPackage.get(String(travelPackage._id)) || [];
      const activeBookings = packageBookings.filter(
        (booking) => booking.bookingStatus !== "cancelled",
      );

      return {
        _id: String(travelPackage._id),
        title: travelPackage.title,
        destination: travelPackage.destination,
        category: travelPackage.category,
        duration: travelPackage.duration,
        tripDate: travelPackage.tripDate,
        price: travelPackage.price,
        image: travelPackage.images?.[0] || "",
        bookingCount: activeBookings.length,
        travelers: activeBookings.reduce(
          (total, booking) => total + Number(booking.travelers || 0),
          0,
        ),
        confirmedBookings: activeBookings.filter(
          (booking) => booking.bookingStatus === "confirmed",
        ).length,
        pendingBookings: activeBookings.filter(
          (booking) => booking.bookingStatus === "pending",
        ).length,
        cancelledBookings: packageBookings.length - activeBookings.length,
        collectedAmount: activeBookings
          .filter((booking) => booking.paymentStatus === "paid")
          .reduce(
            (total, booking) => total + Number(booking.totalAmount || 0),
            0,
          ),
        dueAmount: activeBookings
          .filter(
            (booking) =>
              booking.paymentStatus !== "paid" &&
              booking.paymentStatus !== "refunded",
          )
          .reduce(
            (total, booking) => total + Number(booking.totalAmount || 0),
            0,
          ),
        bookings: packageBookings,
      };
    });

    return NextResponse.json({ tours });
  } catch (error) {
    console.error("Admin upcoming tours error:", error);

    return NextResponse.json(
      { message: "Failed to load upcoming tours" },
      { status: 500 },
    );
  }
}
