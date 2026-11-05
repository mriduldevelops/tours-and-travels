import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Booking from "@/models/Booking";
import User from "@/models/User";

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

    const users = await User.find({ role: "user" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const customerIds = users.map((customer) => customer._id);
    const bookingStats = await Booking.aggregate([
      { $match: { user: { $in: customerIds } } },
      {
        $group: {
          _id: "$user",
          bookingCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0],
            },
          },
        },
      },
    ]);
    const statsByCustomer = new Map(
      bookingStats.map((stats) => [String(stats._id), stats]),
    );

    return NextResponse.json({
      customers: users.map((customer) => {
        const stats = statsByCustomer.get(String(customer._id));

        return {
          _id: String(customer._id),
          name: customer.name,
          email: customer.email,
          createdAt: customer.createdAt,
          bookingCount: stats?.bookingCount || 0,
          totalSpent: stats?.totalSpent || 0,
        };
      }),
    });
  } catch (error) {
    console.error("Admin customers error:", error);

    return NextResponse.json(
      { message: "Failed to load customers" },
      { status: 500 },
    );
  }
}
