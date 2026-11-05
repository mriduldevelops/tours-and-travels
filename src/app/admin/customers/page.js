"use client";

import { useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import TravelLoader from "@/components/TravelLoader";
import dashboardStyles from "../dashboard/AdminDashboard.module.css";
import listStyles from "../AdminList.module.css";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch("/api/admin/customers", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load customers");
        }

        setCustomers(data.customers || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load customers");
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term),
    );
  }, [customers, search]);

  const customersWithBookings = customers.filter(
    (customer) => customer.bookingCount > 0,
  ).length;
  const totalPaid = customers.reduce(
    (total, customer) => total + Number(customer.totalSpent || 0),
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
          <a href="/admin/bookings" className={dashboardStyles.navLink}>
            <span>▤</span> Bookings
          </a>
          <a href="/admin/customers" className={dashboardStyles.navActive}>
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
            <p className={dashboardStyles.breadcrumb}>Workspace / Customers</p>
            <h1>Customers</h1>
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
            <p className={dashboardStyles.eyebrow}>CUSTOMER DIRECTORY</p>
            <h2>Know your travelers</h2>
            <p>View customer accounts and their booking activity.</p>
          </div>
        </section>

        {error && (
          <div className={dashboardStyles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <section className={dashboardStyles.statsGrid}>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>♙</div>
            <div className={dashboardStyles.statText}>
              <p>Total Customers</p>
              <h3>{customers.length}</h3>
              <span>Registered customer accounts</span>
            </div>
          </div>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>▤</div>
            <div className={dashboardStyles.statText}>
              <p>Booked a Trip</p>
              <h3>{customersWithBookings}</h3>
              <span>Customers with reservations</span>
            </div>
          </div>
          <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statIcon}>₹</div>
            <div className={dashboardStyles.statText}>
              <p>Payments Received</p>
              <h3>{formatAmount(totalPaid)}</h3>
              <span>Paid bookings only</span>
            </div>
          </div>
        </section>

        <section className={dashboardStyles.packageSection}>
          <div className={dashboardStyles.sectionHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>CUSTOMER ACCOUNTS</p>
              <h2>All Customers</h2>
            </div>
            <div className={dashboardStyles.searchBox}>
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search customers..."
                aria-label="Search customers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.packageTable}>
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>JOINED</th>
                  <th>BOOKINGS</th>
                  <th>PAID TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className={dashboardStyles.emptyState}>
                      <TravelLoader label="Gathering customer details" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className={dashboardStyles.emptyState}>
                      Customers could not be loaded.
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={dashboardStyles.emptyState}>
                      No customers match your search.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td>
                        <strong>{customer.name}</strong>
                        <small className={listStyles.secondaryText}>
                          {customer.email}
                        </small>
                      </td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>{customer.bookingCount}</td>
                      <td className={dashboardStyles.price}>
                        {formatAmount(customer.totalSpent)}
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
