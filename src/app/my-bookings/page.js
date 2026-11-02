"use client";

import { useEffect, useState } from "react";
import styles from "./MyBookings.module.css";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings/my-bookings", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load bookings");
        }

        setBookings(data.bookings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function statusClass(status) {
    if (status === "paid" || status === "confirmed") {
      return styles.statusSuccess;
    }

    if (status === "failed" || status === "cancelled") {
      return styles.statusFailed;
    }

    return styles.statusPending;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>
          TRAVEL<span>É</span>
        </a>

        <a href="/packages" className={styles.backLink}>
          Explore Packages →
        </a>
      </header>

      <section className={styles.intro}>
        <p>YOUR TRAVEL JOURNEY</p>
        <h1>My Bookings</h1>
        <span>All your travel reservations in one place.</span>
      </section>

      {loading && <div className={styles.empty}>Loading your bookings...</div>}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✈</div>
          <h2>No bookings yet</h2>
          <p>Your next memorable journey is waiting.</p>
          <a href="/packages" className={styles.exploreButton}>
            Explore Packages
          </a>
        </div>
      )}

      <section className={styles.bookingList}>
        {bookings.map((booking) => (
          <article className={styles.bookingCard} key={booking._id}>
            <div className={styles.bookingTop}>
              <div>
                <span className={styles.destination}>
                  {booking.destination}
                </span>

                <h2>{booking.packageTitle}</h2>
              </div>

              <span
                className={`${styles.status} ${statusClass(
                  booking.bookingStatus,
                )}`}
              >
                {booking.bookingStatus}
              </span>
            </div>

            <div className={styles.detailsGrid}>
              <div>
                <span>Travel Date</span>
                <strong>{formatDate(booking.travelDate)}</strong>
              </div>

              <div>
                <span>Travelers</span>
                <strong>{booking.travelers}</strong>
              </div>

              <div>
                <span>Booking Amount</span>
                <strong>
                  ₹{Number(booking.totalAmount).toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <span>Payment Status</span>
                <strong
                  className={`${styles.statusText} ${statusClass(
                    booking.paymentStatus,
                  )}`}
                >
                  {booking.paymentStatus}
                </strong>
              </div>
            </div>

            <div className={styles.bookingBottom}>
              <span>Booking ID: {booking._id.slice(-8).toUpperCase()}</span>

              {booking.paymentStatus !== "paid" && (
                <span className={styles.pendingNote}>
                  Payment confirmation pending
                </span>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
