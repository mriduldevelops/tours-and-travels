"use client";

import { useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import TravelLoader from "@/components/TravelLoader";
import dashboardStyles from "../dashboard/AdminDashboard.module.css";
import styles from "./UpcomingTours.module.css";

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function statusClass(status) {
  if (status === "paid" || status === "confirmed") {
    return styles.statusSuccess;
  }

  if (
    status === "failed" ||
    status === "refunded" ||
    status === "cancelled"
  ) {
    return styles.statusFailure;
  }

  return styles.statusPending;
}

export default function UpcomingToursPage() {
  const [tours, setTours] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTours() {
      try {
        const response = await fetch("/api/admin/upcoming-tours", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load upcoming tours");
        }

        setTours(data.tours || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load upcoming tours");
      } finally {
        setLoading(false);
      }
    }

    loadTours();
  }, []);

  const filteredTours = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return tours;

    return tours.filter((tour) =>
      [tour.title, tour.destination, tour.category].some((value) =>
        value?.toLowerCase().includes(term),
      ),
    );
  }, [tours, search]);

  const totals = useMemo(
    () =>
      tours.reduce(
        (total, tour) => ({
          travelers: total.travelers + tour.travelers,
          collected: total.collected + tour.collectedAmount,
          due: total.due + tour.dueAmount,
        }),
        { travelers: 0, collected: 0, due: 0 },
      ),
    [tours],
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
          <a href="/admin/bookings" className={dashboardStyles.navLink}>
            <span>▤</span> Bookings
          </a>
          <a
            href="/admin/upcoming-tours"
            className={dashboardStyles.navActive}
            aria-current="page"
          >
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
            <p className={dashboardStyles.breadcrumb}>
              Workspace / Upcoming Tours
            </p>
            <h1>Upcoming Tours</h1>
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
            <p className={dashboardStyles.eyebrow}>TRIP OPERATIONS</p>
            <h2>Every upcoming departure, at a glance</h2>
            <p>
              Track trip schedules, traveler bookings, and payment collection
              across your active tours.
            </p>
          </div>
        </section>

        {error && (
          <div className={dashboardStyles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <section className={dashboardStyles.statsGrid}>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>✈</div>
            <div className={dashboardStyles.statText}>
              <p>Upcoming Trips</p>
              <h3>{loading ? "—" : tours.length}</h3>
              <span>Active scheduled departures</span>
            </div>
          </div>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>♙</div>
            <div className={dashboardStyles.statText}>
              <p>Travelers Booked</p>
              <h3>{loading ? "—" : totals.travelers}</h3>
              <span>Excludes cancelled bookings</span>
            </div>
          </div>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>₹</div>
            <div className={dashboardStyles.statText}>
              <p>Payments Received</p>
              <h3>{loading ? "—" : formatAmount(totals.collected)}</h3>
              <span>{formatAmount(totals.due)} still due</span>
            </div>
          </div>
        </section>

        <section className={styles.tourList} aria-label="Upcoming trip list">
          <div className={dashboardStyles.sectionHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>DEPARTURE SCHEDULE</p>
              <h2>Trip overview</h2>
            </div>
            <div className={dashboardStyles.searchBox}>
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search trips..."
                aria-label="Search upcoming trips"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyTours}>
              <TravelLoader label="Gathering your upcoming departures" />
            </div>
          ) : error ? (
            <div className={styles.emptyTours} role="status">
              Upcoming trips could not be loaded.
            </div>
          ) : filteredTours.length === 0 ? (
            <div className={styles.emptyTours}>
              <strong>
                {tours.length
                  ? "No trips match your search"
                  : "No upcoming trips scheduled"}
              </strong>
              <span>
                {tours.length
                  ? "Try another trip name or destination."
                  : "Active packages with a trip date today or later will appear here."}
              </span>
            </div>
          ) : (
            filteredTours.map((tour) => {
              const isToday =
                tour.tripDate === new Date().toISOString().slice(0, 10);
              const paymentBase = tour.collectedAmount + tour.dueAmount;
              const paidPercent = paymentBase
                ? (tour.collectedAmount / paymentBase) * 100
                : 0;

              return (
                <article className={styles.tourCard} key={tour._id}>
                  <div className={styles.tourHeader}>
                    <div className={styles.tourImage}>
                      {tour.image ? (
                        <img src={tour.image} alt="" />
                      ) : (
                        <span>✈</span>
                      )}
                    </div>
                    <div className={styles.tourIdentity}>
                      <h2>{tour.title}</h2>
                      <p>
                        {tour.destination} · {formatDate(tour.tripDate)} ·{" "}
                        {tour.duration}
                      </p>
                      <span className={styles.tourCategory}>
                        {tour.category}
                      </span>
                    </div>
                    <span className={styles.tripStatus}>
                      {isToday ? "Departing today" : "Upcoming"}
                    </span>
                  </div>

                  <div className={styles.metricGrid}>
                    <div className={styles.metric}>
                      <span>TRAVELERS</span>
                      <strong>{tour.travelers}</strong>
                      <small>
                        {tour.bookingCount} active{" "}
                        {tour.bookingCount === 1 ? "booking" : "bookings"}
                      </small>
                    </div>
                    <div className={styles.metric}>
                      <span>BOOKING STATUS</span>
                      <strong>{tour.confirmedBookings} confirmed</strong>
                      <small>{tour.pendingBookings} awaiting confirmation</small>
                    </div>
                    <div className={styles.metric}>
                      <span>PAYMENTS RECEIVED</span>
                      <strong>{formatAmount(tour.collectedAmount)}</strong>
                      <small>
                        {tour.cancelledBookings} cancelled{" "}
                        {tour.cancelledBookings === 1 ? "booking" : "bookings"}
                      </small>
                    </div>
                    <div className={styles.metric}>
                      <span>PAYMENTS DUE</span>
                      <strong>{formatAmount(tour.dueAmount)}</strong>
                      <div
                        className={styles.paymentBar}
                        role="progressbar"
                        aria-label="Payment collection progress"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={Math.round(paidPercent)}
                      >
                        <span
                          style={{
                            display: "block",
                            width: `${paidPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {tour.bookings.length === 0 ? (
                    <p className={styles.bookingEmpty}>
                      No traveler bookings for this departure yet.
                    </p>
                  ) : (
                    <details className={styles.bookingDetails}>
                      <summary>
                        Traveler bookings <span>({tour.bookings.length})</span>
                      </summary>
                      <div className={styles.bookingTableWrapper}>
                        <table className={styles.bookingTable}>
                          <thead>
                            <tr>
                              <th>TRAVELER</th>
                              <th>BOOKED ON</th>
                              <th>GUESTS</th>
                              <th>AMOUNT</th>
                              <th>PAYMENT</th>
                              <th>BOOKING</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tour.bookings.map((booking) => (
                              <tr key={booking._id}>
                                <td>
                                  <strong>
                                    {booking.user?.name ||
                                      "Customer account unavailable"}
                                  </strong>
                                  {booking.user?.email && (
                                    <small>{booking.user.email}</small>
                                  )}
                                </td>
                                <td>{formatDateTime(booking.createdAt)}</td>
                                <td>{booking.travelers}</td>
                                <td>{formatAmount(booking.totalAmount)}</td>
                                <td>
                                  <span
                                    className={`${styles.statusBadge} ${statusClass(
                                      booking.paymentStatus,
                                    )}`}
                                  >
                                    {booking.paymentStatus}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`${styles.statusBadge} ${statusClass(
                                      booking.bookingStatus,
                                    )}`}
                                  >
                                    {booking.bookingStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                  <a className={styles.bookingLink} href="/admin/bookings">
                    Manage all bookings →
                  </a>
                </article>
              );
            })
          )}
        </section>

        <footer className={dashboardStyles.footer}>
          <span>MANCHALE TRAVELERS ADMIN CONSOLE</span>
          <span>Manage. Curate. Explore.</span>
        </footer>
      </main>
    </div>
  );
}
