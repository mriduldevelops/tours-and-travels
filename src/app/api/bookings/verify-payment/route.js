import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import razorpay from "@/lib/razorpay";
import { getCurrentUser } from "@/lib/auth";

function verifySignature(orderId, paymentId, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature || "", "hex");

  if (expected.length !== received.length || expected.length === 0) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in" }, { status: 401 });
    }

    const body = await request.json();

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { message: "Payment verification details are incomplete" },
        { status: 400 },
      );
    }

    const signatureValid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!signatureValid) {
      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 },
      );
    }

    await connectDB();

    const booking = await Booking.findOne({
      _id: bookingId,
      user: user._id,
      razorpayOrderId: razorpay_order_id,
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    // Idempotent response if this booking was already confirmed.
    if (
      booking.paymentStatus === "paid" &&
      booking.razorpayPaymentId === razorpay_payment_id
    ) {
      return NextResponse.json({
        success: true,
        message: "Booking already confirmed",
        bookingId: String(booking._id),
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
      });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== booking.razorpayOrderId ||
      Number(payment.amount) !== Math.round(booking.totalAmount * 100) ||
      payment.currency !== booking.currency
    ) {
      return NextResponse.json(
        { message: "Payment details do not match this booking" },
        { status: 400 },
      );
    }

    if (payment.status === "captured") {
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.paymentStatus = "paid";
      booking.bookingStatus = "confirmed";

      await booking.save();

      return NextResponse.json({
        success: true,
        message: "Payment successful. Booking confirmed.",
        bookingId: String(booking._id),
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
      });
    }

    if (payment.status === "authorized") {
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.paymentStatus = "pending";
      booking.bookingStatus = "pending";

      await booking.save();

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment is authorized but not captured yet. Booking remains pending.",
          bookingId: String(booking._id),
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
        },
        { status: 202 },
      );
    }

    booking.paymentStatus = "failed";
    booking.bookingStatus = "pending";
    booking.razorpayPaymentId = razorpay_payment_id;

    await booking.save();

    return NextResponse.json(
      {
        success: false,
        message: `Payment status is ${payment.status}`,
        paymentStatus: booking.paymentStatus,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      { message: "Unable to verify payment" },
      { status: 500 },
    );
  }
}
