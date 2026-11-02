"use client";

import { useEffect, useState } from "react";
import styles from "./AdminDashboard.module.css";

const emptyForm = {
  title: "",
  destination: "",
  category: "Adventure",
  duration: "",
  price: "",
  originalPrice: "",
  description: "",
  images: "",
  itinerary: [],
  inclusions: "",
  exclusions: "",
  featured: false,
  active: true,
};

const categories = [
  "Adventure",
  "Honeymoon",
  "Family",
  "Luxury",
  "Cultural",
  "Wildlife",
  "Beach",
  "Pilgrimage",
];

export default function AdminDashboard() {
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalUsers: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const packageResponse = await fetch("/api/admin/packages", {
        cache: "no-store",
      });

      const packageData = await packageResponse.json();

      if (!packageResponse.ok) {
        throw new Error(packageData.message || "Unable to load packages");
      }

      const packageList = packageData.packages || [];

      setPackages(packageList);

      const usersResponse = await fetch("/api/admin/stats", {
        cache: "no-store",
      });

      if (usersResponse.ok) {
        const statsData = await usersResponse.json();
        setStats({
          totalPackages: packageList.length,
          activePackages: packageList.filter((item) => item.active).length,
          totalUsers: statsData.totalUsers || 0,
        });
      } else {
        setStats({
          totalPackages: packageList.length,
          activePackages: packageList.filter((item) => item.active).length,
          totalUsers: 0,
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item._id);

    setForm({
      title: item.title || "",
      destination: item.destination || "",
      category: item.category || "Adventure",
      duration: item.duration || "",
      price: item.price ?? "",
      originalPrice: item.originalPrice ?? "",
      description: item.description || "",
      images: (item.images || []).join("\n"),
      itinerary: item.itinerary || [],
      inclusions: (item.inclusions || []).join("\n"),
      exclusions: (item.exclusions || []).join("\n"),
      featured: Boolean(item.featured),
      active: item.active !== false,
    });

    setError("");
    setModalOpen(true);
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function savePackage(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const endpoint = editingId
        ? `/api/admin/packages/${editingId}`
        : "/api/admin/packages";

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save package");
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);

      setNotice(
        editingId
          ? "Package updated successfully"
          : "Package created successfully",
      );

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to save package");
    } finally {
      setSaving(false);
    }
  }

  async function deletePackage(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this package? This action cannot be undone.",
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/packages/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete package");
      }

      setNotice("Package deleted successfully");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to delete package");
    }
  }

  async function togglePackage(item) {
    try {
      const response = await fetch(`/api/admin/packages/${item._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !item.active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to change package status");
      }

      setNotice(item.active ? "Package deactivated" : "Package activated");

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to change status");
    }
  }

  const filteredPackages = packages.filter((item) => {
    const term = search.toLowerCase();

    return (
      item.title?.toLowerCase().includes(term) ||
      item.destination?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>✦</span>
          <div>
            <h2>
              TRAVEL<span>É</span>
            </h2>
            <p>ADMIN CONSOLE</p>
          </div>
        </div>

        <div className={styles.sidebarLabel}>WORKSPACE</div>

        <nav className={styles.navigation}>
          <a href="/admin/dashboard" className={styles.navActive}>
            <span>▦</span> Dashboard
          </a>

          <a href="#packages" className={styles.navLink}>
            <span>✈</span> Tour Packages
          </a>

          <a href="/admin/bookings" className={styles.navLink}>
            <span>▤</span> Bookings
          </a>

          <a href="/admin/users" className={styles.navLink}>
            <span>♙</span> Customers
          </a>

          <a href="/admin/reviews" className={styles.navLink}>
            <span>☆</span> Reviews
          </a>
        </nav>

        <div className={styles.sidebarBottom}>
          <a href="/" className={styles.navLink}>
            <span>↗</span> View Website
          </a>

          <button
            className={styles.logoutButton}
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            <span>⇥</span> Logout
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.breadcrumb}>Workspace / Overview</p>
            <h1>Dashboard</h1>
          </div>

          <div className={styles.adminProfile}>
            <div className={styles.avatar}>A</div>
            <div>
              <strong>Administrator</strong>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        <section className={styles.welcomeSection}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATION</p>
            <h2>
              Welcome back, Admin <span>✦</span>
            </h2>
            <p>Manage your travel experiences and package inventory.</p>
          </div>

          <button className={styles.primaryButton} onClick={openCreateModal}>
            <span>＋</span> Add New Package
          </button>
        </section>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {notice && <div className={styles.successMessage}>{notice}</div>}

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✈</div>
            <div className={styles.statText}>
              <p>Total Packages</p>
              <h3>{stats.totalPackages}</h3>
              <span>In your inventory</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>◉</div>
            <div className={styles.statText}>
              <p>Active Packages</p>
              <h3>{stats.activePackages}</h3>
              <span>Currently published</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>♙</div>
            <div className={styles.statText}>
              <p>Registered Users</p>
              <h3>{stats.totalUsers}</h3>
              <span>Customer accounts</span>
            </div>
          </div>
        </section>

        <section className={styles.packageSection} id="packages">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>INVENTORY</p>
              <h2>Tour Packages</h2>
            </div>

            <div className={styles.searchBox}>
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search packages..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.packageTable}>
              <thead>
                <tr>
                  <th>PACKAGE</th>
                  <th>DESTINATION</th>
                  <th>DURATION</th>
                  <th>PRICE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      Loading packages...
                    </td>
                  </tr>
                ) : filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      No packages found. Add your first package.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className={styles.packageCell}>
                          <div className={styles.packageImage}>
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.title} />
                            ) : (
                              <span>✈</span>
                            )}
                          </div>

                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.category}</small>
                          </div>
                        </div>
                      </td>

                      <td>{item.destination}</td>

                      <td>{item.duration}</td>

                      <td className={styles.price}>
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </td>

                      <td>
                        <button
                          className={
                            item.active
                              ? styles.statusActive
                              : styles.statusInactive
                          }
                          onClick={() => togglePackage(item)}
                        >
                          {item.active ? "● Active" : "○ Inactive"}
                        </button>
                      </td>

                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.editButton}
                            onClick={() => openEditModal(item)}
                            title="Edit package"
                          >
                            ✎
                          </button>

                          <button
                            className={styles.deleteButton}
                            onClick={() => deletePackage(item._id)}
                            title="Delete package"
                          >
                            ♲
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>TRAVELÉ ADMIN CONSOLE</span>
          <span>Manage. Curate. Explore.</span>
        </footer>
      </main>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>PACKAGE MANAGEMENT</p>

                <h2>{editingId ? "Edit Package" : "Create New Package"}</h2>
              </div>

              <button
                className={styles.closeButton}
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={savePackage}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Package Name *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    placeholder="e.g. Royal Rajasthan Escape"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Destination *</label>
                  <input
                    required
                    value={form.destination}
                    onChange={(e) => updateForm("destination", e.target.value)}
                    placeholder="e.g. Jaipur, Rajasthan"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Duration *</label>
                  <input
                    required
                    value={form.duration}
                    onChange={(e) => updateForm("duration", e.target.value)}
                    placeholder="e.g. 5 Days / 4 Nights"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => updateForm("price", e.target.value)}
                    placeholder="25000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Original Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) =>
                      updateForm("originalPrice", e.target.value)
                    }
                    placeholder="30000"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description *</label>
                  <textarea
                    required
                    rows="4"
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="Describe this travel experience..."
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Image URLs (one URL per line)</label>
                  <textarea
                    rows="3"
                    value={form.images}
                    onChange={(e) => updateForm("images", e.target.value)}
                    placeholder={
                      "https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                    }
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Inclusions (one per line)</label>
                  <textarea
                    rows="3"
                    value={form.inclusions}
                    onChange={(e) => updateForm("inclusions", e.target.value)}
                    placeholder={
                      "Hotel accommodation\nBreakfast\nAirport transfers"
                    }
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Exclusions (one per line)</label>
                  <textarea
                    rows="3"
                    value={form.exclusions}
                    onChange={(e) => updateForm("exclusions", e.target.value)}
                    placeholder={"Flight tickets\nPersonal expenses"}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Itinerary (JSON format)</label>
                  <textarea
                    rows="5"
                    value={JSON.stringify(form.itinerary, null, 2)}
                    onChange={(e) => {
                      try {
                        updateForm("itinerary", JSON.parse(e.target.value));
                      } catch {
                        // Keep the previous valid itinerary while typing.
                      }
                    }}
                    placeholder='[{"day":1,"title":"Arrival","description":"Check in"}]'
                  />
                  <small>
                    Enter valid JSON with day, title, and description.
                  </small>
                </div>
              </div>

              <div className={styles.toggleRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => updateForm("featured", e.target.checked)}
                  />
                  Featured package
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => updateForm("active", e.target.checked)}
                  />
                  Active / Published
                </label>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
