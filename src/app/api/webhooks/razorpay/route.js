import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    expectedBuffer.length === 0
  ) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request) {
  try {
    const rawBody = await request.text();

    const signature = request.headers.get("x-razorpay-signature");

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 400 },
      );
    }

    const event = JSON.parse(rawBody);

    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const amount = Number(paymentEntity.amount);
    const currency = paymentEntity.currency;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { message: "Missing payment identifiers" },
        { status: 400 },
      );
    }

    await connectDB();

    const booking = await Booking.findOne({
      razorpayOrderId: orderId,
    });

    if (!booking) {
      // Acknowledge unknown orders to avoid retry storms.
      // Log and investigate these events in production.
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const expectedAmount = Math.round(booking.totalAmount * 100);

    if (amount !== expectedAmount || currency !== booking.currency) {
      console.error("Webhook amount mismatch", {
        orderId,
        bookingId: String(booking._id),
      });

      return NextResponse.json(
        { message: "Payment amount mismatch" },
        { status: 400 },
      );
    }

    if (event.event === "payment.captured") {
      // Do not let a duplicate event or a different payment
      // overwrite an already-confirmed booking.
      if (
        booking.paymentStatus !== "paid" ||
        booking.razorpayPaymentId === paymentId
      ) {
        booking.paymentStatus = "paid";
        booking.bookingStatus = "confirmed";
        booking.razorpayPaymentId = paymentId;

        await booking.save();
      }
    }

    if (event.event === "payment.failed") {
      // Never downgrade a captured payment.
      if (booking.paymentStatus !== "paid") {
        booking.paymentStatus = "failed";
        booking.razorpayPaymentId = paymentId;

        await booking.save();
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return NextResponse.json(
      { message: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
