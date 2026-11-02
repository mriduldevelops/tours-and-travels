"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        color: "#172c3c",
      }}
    >
      <section
        style={{
          background: "#fff",
          padding: "45px",
          borderRadius: "14px",
          maxWidth: "550px",
          textAlign: "center",
          border: "1px solid #eee8dd",
        }}
      >
        <div style={{ fontSize: "55px", color: "#b08b42" }}>✓</div>

        <p
          style={{
            letterSpacing: "3px",
            fontSize: "10px",
            color: "#b08b42",
            fontWeight: "bold",
          }}
        >
          PAYMENT CONFIRMED
        </p>

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 500,
            fontSize: "32px",
          }}
        >
          Your Journey Awaits
        </h1>

        <p style={{ color: "#89877e", lineHeight: 1.7 }}>
          Your payment was verified and your booking is confirmed. We look
          forward to making your trip memorable.
        </p>

        {bookingId && (
          <p style={{ fontSize: "12px", color: "#777" }}>
            Booking Reference: {bookingId.slice(-8).toUpperCase()}
          </p>
        )}

        <a
          href="/my-bookings"
          style={{
            display: "inline-block",
            marginTop: "20px",
            background: "#172c3c",
            color: "#fff",
            padding: "14px 22px",
            borderRadius: "7px",
            textDecoration: "none",
            fontSize: "12px",
          }}
        >
          View My Bookings
        </a>
      </section>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
