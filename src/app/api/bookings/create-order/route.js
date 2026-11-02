import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Package from "@/models/Package";
import Booking from "@/models/Booking";
import razorpay from "@/lib/razorpay";
import { getCurrentUser } from "@/lib/auth";

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

    const { packageId, travelDate, travelers } = body;

    if (!packageId || !travelDate || !travelers) {
      return NextResponse.json(
        { message: "Package, travel date, and travelers are required" },
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

    const parsedDate = new Date(`${travelDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== travelDate
    ) {
      return NextResponse.json(
        { message: "Invalid travel date" },
        { status: 400 },
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return NextResponse.json(
        { message: "Travel date cannot be in the past" },
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

    const receipt = `bk_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: String(user._id),
        packageId: String(travelPackage._id),
      },
    });

    const booking = await Booking.create({
      user: user._id,
      package: travelPackage._id,
      packageTitle: travelPackage.title,
      destination: travelPackage.destination,
      travelDate: parsedDate,
      travelers: travelerCount,
      pricePerTraveler,
      totalAmount,
      currency: "INR",
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
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        packageTitle: travelPackage.title,
        totalAmount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { message: "Unable to create payment order" },
      { status: 500 },
    );
  }
}
