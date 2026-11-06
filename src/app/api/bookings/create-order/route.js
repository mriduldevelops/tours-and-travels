import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";
import Booking, { ensureBookingIndexes } from "@/models/Booking";
import { getCurrentUser } from "@/lib/auth";
import { isValidFutureTripDate } from "@/lib/trip-date";

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in to book a package" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const { packageId, travelers } = body;
    const paymentMode = body.paymentMode || "pay_now";

    if (!packageId || !travelers) {
      return NextResponse.json(
        { message: "Package and travelers are required" },
        { status: 400 },
      );
    }

    if (!["pay_now", "pay_later"].includes(paymentMode)) {
      return NextResponse.json(
        { message: "Invalid payment mode" },
        { status: 400 },
      );
    }

    const travelerCount = Number(travelers);

    if (
      !Number.isInteger(travelerCount) ||
      travelerCount < 1 ||
      travelerCount > 20
    ) {
      return NextResponse.json(
        { message: "Travelers must be between 1 and 20" },
        { status: 400 },
      );
    }

    await connectDB();

    const travelPackage = await Package.findOne({
      _id: packageId,
      active: true,
    });

    if (!travelPackage) {
      return NextResponse.json(
        { message: "Package not found or unavailable" },
        { status: 404 },
      );
    }

    if (!isValidFutureTripDate(travelPackage.tripDate)) {
      return NextResponse.json(
        { message: "This package does not have an upcoming trip date." },
        { status: 400 },
      );
    }

    const parsedDate = new Date(
      `${travelPackage.tripDate}T00:00:00.000Z`,
    );
    const pricePerTraveler = Number(travelPackage.price);

    if (!Number.isFinite(pricePerTraveler) || pricePerTraveler <= 0) {
      return NextResponse.json(
        { message: "Package has an invalid price" },
        { status: 400 },
      );
    }

    const totalAmount = pricePerTraveler * travelerCount;
    const amountInPaise = Math.round(totalAmount * 100);

    if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
      return NextResponse.json(
        { message: "Invalid booking amount" },
        { status: 400 },
      );
    }

    await ensureBookingIndexes();

    const bookingDetails = {
      user: user.userId,
      package: travelPackage._id,
      packageTitle: travelPackage.title,
      destination: travelPackage.destination,
      travelDate: parsedDate,
      travelers: travelerCount,
      pricePerTraveler,
      totalAmount,
      currency: "INR",
    };

    if (paymentMode === "pay_later") {
      const booking = await Booking.create({
        ...bookingDetails,
        paymentStatus: "unpaid",
        bookingStatus: "confirmed",
        paymentMethod: "Pay Later",
      });

      return NextResponse.json(
        {
          message: "Booking confirmed. Payment is due later.",
          bookingId: String(booking._id),
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          totalAmount,
        },
        { status: 201 },
      );
    }

    const receipt = `bk_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const { default: razorpay } = await import("@/lib/razorpay");
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: String(user.userId),
        packageId: String(travelPackage._id),
      },
    });

    const booking = await Booking.create({
      ...bookingDetails,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "created",
      bookingStatus: "pending",
    });

    return NextResponse.json(
      {
        message: "Order created successfully",
        bookingId: String(booking._id),
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        packageTitle: travelPackage.title,
        totalAmount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create booking error:", error);

    if (error?.code === 11000 && error?.keyPattern?.razorpayOrderId) {
      return NextResponse.json(
        {
          message:
            "The database still has the old Razorpay order index. Update the razorpayOrderId index as described in the README, then retry.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Unable to create booking" },
      { status: 500 },
    );
  }
}
