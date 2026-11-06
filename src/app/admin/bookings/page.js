"use client";

import { useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import TravelLoader from "@/components/TravelLoader";
import dashboardStyles from "../dashboard/AdminDashboard.module.css";
import listStyles from "../AdminList.module.css";

const bookingStatuses = ["all", "pending", "confirmed", "cancelled"];
const paymentStatuses = [
  "created",
  "pending",
  "unpaid",
  "paid",
  "failed",
  "refunded",
];

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function getStatusClass(status) {
  if (status === "paid" || status === "confirmed") {
    return listStyles.statusSuccess;
  }

  if (status === "failed" || status === "refunded" || status === "cancelled") {
    return listStyles.statusFailure;
  }

  return listStyles.statusPending;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingBookings, setUpdatingBookings] = useState(() => new Set());

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await fetch("/api/admin/bookings", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load bookings");
        }

        setBookings(data.bookings || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load bookings");
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  async function updateBookingStatus(bookingId, field, value) {
    setUpdatingBookings((current) => new Set(current).add(bookingId));
    setUpdateError("");

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, field, value }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update booking");
      }

      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId
            ? { ...booking, ...data.booking }
            : booking,
        ),
      );
    } catch (updateFailure) {
      setUpdateError(updateFailure.message || "Unable to update booking");
    } finally {
      setUpdatingBookings((current) => {
        const next = new Set(current);
        next.delete(bookingId);
        return next;
      });
    }
  }

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" || booking.bookingStatus === statusFilter;
      const matchesSearch =
        !term ||
        [
          booking._id,
          booking.packageTitle,
          booking.destination,
          booking.user?.name,
          booking.user?.email,
        ].some((value) => value?.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  const paidBookings = bookings.filter(
    (booking) => booking.paymentStatus === "paid",
  );
  const collectedAmount = paidBookings.reduce(
    (total, booking) => total + Number(booking.totalAmount || 0),
    0,
  );

  return (
    <div className={dashboardStyles.dashboard}>
      <aside className={dashboardStyles.sidebar}>
        <BrandLogo variant="light" className={dashboardStyles.brand} />
        <div className={dashboardStyles.sidebarLabel}>WORKSPACE</div>
        <nav className={dashboardStyles.navigation}>
          <a href="/admin/dashboard" className={dashboardStyles.navLink}>
            <span>▦</span> Dashboard
          </a>
          <a
            href="/admin/dashboard#packages"
            className={dashboardStyles.navLink}
          >
            <span>✈</span> Tour Packages
          </a>
          <a href="/admin/bookings" className={dashboardStyles.navActive}>
            <span>▤</span> Bookings
          </a>
          <a href="/admin/upcoming-tours" className={dashboardStyles.navLink}>
            <span>◷</span> Upcoming Tours
          </a>
          <a href="/admin/customers" className={dashboardStyles.navLink}>
            <span>♙</span> Customers
          </a>
          <a href="/admin/reviews" className={dashboardStyles.navLink}>
            <span>☆</span> Reviews
          </a>
        </nav>
        <div className={dashboardStyles.sidebarBottom}>
          <a href="/" className={dashboardStyles.navLink}>
            <span>↗</span> View Website
          </a>
          <button
            className={dashboardStyles.logoutButton}
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            <span>⇥</span> Logout
          </button>
        </div>
      </aside>

      <main className={dashboardStyles.main}>
        <header className={dashboardStyles.topbar}>
          <div>
            <p className={dashboardStyles.breadcrumb}>Workspace / Bookings</p>
            <h1>Bookings</h1>
          </div>
          <div className={dashboardStyles.adminProfile}>
            <div className={dashboardStyles.avatar}>A</div>
            <div>
              <strong>Administrator</strong>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        <section className={dashboardStyles.welcomeSection}>
          <div>
            <p className={dashboardStyles.eyebrow}>RESERVATIONS</p>
            <h2>Manage bookings</h2>
            <p>Review trip details, customer information, and payment status.</p>
          </div>
        </section>

        {error && (
          <div className={dashboardStyles.errorMessage} role="alert">
            {error}
          </div>
        )}
        {updateError && (
          <div className={dashboardStyles.errorMessage} role="alert">
            {updateError}
          </div>
        )}

        <section className={dashboardStyles.statsGrid}>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>▤</div>
            <div className={dashboardStyles.statText}>
              <p>Total Bookings</p>
              <h3>{bookings.length}</h3>
              <span>All reservations</span>
            </div>
          </div>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>✓</div>
            <div className={dashboardStyles.statText}>
              <p>Confirmed</p>
              <h3>
                {
                  bookings.filter(
                    (booking) => booking.bookingStatus === "confirmed",
                  ).length
                }
              </h3>
              <span>Confirmed trips</span>
            </div>
          </div>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>₹</div>
            <div className={dashboardStyles.statText}>
              <p>Payments Received</p>
              <h3>{formatAmount(collectedAmount)}</h3>
              <span>Paid bookings only</span>
            </div>
          </div>
        </section>

        <section className={dashboardStyles.packageSection}>
          <div className={dashboardStyles.sectionHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>TRIP RESERVATIONS</p>
              <h2>All Bookings</h2>
            </div>
            <div className={listStyles.toolbar}>
              <div className={dashboardStyles.searchBox}>
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search bookings..."
                  aria-label="Search bookings"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select
                className={listStyles.filterSelect}
                aria-label="Filter by booking status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {bookingStatuses.map((status) => (
                  <option value={status} key={status}>
                    {status === "all"
                      ? "All statuses"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.packageTable}>
              <thead>
                <tr>
                  <th>BOOKING</th>
                  <th>CUSTOMER</th>
                  <th>TRIP</th>
                  <th>TRAVEL DATE</th>
                  <th>TRAVELERS</th>
                  <th>AMOUNT</th>
                  <th>PAYMENT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className={dashboardStyles.emptyState}>
                      <TravelLoader label="Gathering booking details" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className={dashboardStyles.emptyState}>
                      Bookings could not be loaded.
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={dashboardStyles.emptyState}>
                      No bookings match your search.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <strong>
                          #{booking._id.slice(-8).toUpperCase()}
                        </strong>
                        <small className={listStyles.secondaryText}>
                          {formatDateTime(booking.createdAt)}
                        </small>
                      </td>
                      <td>
                        <strong>{booking.user?.name || "Customer account unavailable"}</strong>
                        {booking.user?.email && (
                          <small className={listStyles.secondaryText}>
                            {booking.user.email}
                          </small>
                        )}
                      </td>
                      <td>
                        <strong>{booking.packageTitle}</strong>
                        <small className={listStyles.secondaryText}>
                          {booking.destination}
                        </small>
                      </td>
                      <td>{formatDate(booking.travelDate)}</td>
                      <td>{booking.travelers}</td>
                      <td className={dashboardStyles.price}>
                        {formatAmount(booking.totalAmount)}
                      </td>
                      <td>
                        <select
                          className={`${listStyles.statusBadge} ${listStyles.statusSelect} ${getStatusClass(
                            booking.paymentStatus,
                          )}`}
                          aria-label={`Payment status for booking ${booking._id}`}
                          value={booking.paymentStatus}
                          disabled={updatingBookings.has(booking._id)}
                          onChange={(event) =>
                            updateBookingStatus(
                              booking._id,
                              "paymentStatus",
                              event.target.value,
                            )
                          }
                        >
                          {paymentStatuses.map((status) => (
                            <option value={status} key={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className={`${listStyles.statusBadge} ${listStyles.statusSelect} ${getStatusClass(
                            booking.bookingStatus,
                          )}`}
                          aria-label={`Booking status for booking ${booking._id}`}
                          value={booking.bookingStatus}
                          disabled={updatingBookings.has(booking._id)}
                          onChange={(event) =>
                            updateBookingStatus(
                              booking._id,
                              "bookingStatus",
                              event.target.value,
                            )
                          }
                        >
                          {bookingStatuses
                            .filter((status) => status !== "all")
                            .map((status) => (
                              <option value={status} key={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className={dashboardStyles.footer}>
          <span>MANCHALE TRAVELERS ADMIN CONSOLE</span>
          <span>Manage. Curate. Explore.</span>
        </footer>
      </main>
    </div>
  );
}
