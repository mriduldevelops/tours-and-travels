import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Package from "@/models/Package";
import { getCurrentUser } from "@/lib/auth";

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

    const [totalUsers, totalPackages, activePackages] = await Promise.all([
      User.countDocuments(),
      Package.countDocuments(),
      Package.countDocuments({ active: true }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalPackages,
      activePackages,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return NextResponse.json(
      { message: "Failed to load statistics" },
      { status: 500 },
    );
  }
}
