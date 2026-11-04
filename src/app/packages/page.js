"use client";

import { useEffect, useMemo, useState } from "react";
import AuthNavActions from "@/components/AuthNavActions";
import BrandLogo from "@/components/BrandLogo";
import NavLinks from "@/components/NavLinks";
import TravelLoader from "@/components/TravelLoader";

const formatPrice = (price) => `₹${price.toLocaleString("en-IN")}`;

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("All Destinations");
  const [duration, setDuration] = useState("All Durations");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState("recommended");

  const [travelers, setTravelers] = useState("1");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPackages() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/packages", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch packages");
        }

        if (!Array.isArray(data.packages)) {
          throw new Error("The packages response is invalid");
        }

        setPackages(data.packages);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to fetch packages",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPackages();

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setSearch(params.get("destination") || "");
    setTravelers(params.get("travelers") || "1");
  }, []);

  const destinations = useMemo(() => {
    return [
      "All Destinations",
      ...new Set(packages.map((pkg) => pkg.destination)),
    ];
  }, [packages]);

  const filteredPackages = useMemo(() => {
    let result = packages.filter((pkg) => {
      const matchesSearch =
        pkg.title.toLowerCase().includes(search.toLowerCase()) ||
        pkg.destination.toLowerCase().includes(search.toLowerCase());

      const matchesDestination =
        destination === "All Destinations" || pkg.destination === destination;

      const matchesPrice = pkg.price <= maxPrice;
      const days = Number.parseInt(pkg.duration, 10);

      let matchesDuration = true;

      if (duration === "1-3 Days") {
        matchesDuration = days >= 1 && days <= 3;
      } else if (duration === "4-5 Days") {
        matchesDuration = days >= 4 && days <= 5;
      } else if (duration === "6-7 Days") {
        matchesDuration = days >= 6 && days <= 7;
      } else if (duration === "8+ Days") {
        matchesDuration = days >= 8;
      }

      return (
        matchesSearch && matchesDestination && matchesPrice && matchesDuration
      );
    });

    if (sortBy === "recommended") {
      result.sort((a, b) => Number(b.featured) - Number(a.featured));
    } else if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [packages, search, destination, duration, maxPrice, sortBy]);

  function clearFilters() {
    setSearch("");
    setDestination("All Destinations");
    setDuration("All Durations");
    setMaxPrice(100000);
    setSortBy("recommended");
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1b2638]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">
          <BrandLogo />

          <div className="hidden gap-8 text-sm font-medium md:flex">
            <NavLinks />
          </div>

          <AuthNavActions variant="packages" />
        </div>
      </nav>

      {/* Page Hero */}
      <section className="relative overflow-hidden bg-[#1b2638] px-5 py-20 text-white md:px-10 md:py-28">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#c49a55]/10 to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[4px] text-[#c49a55]">
            Explore the world
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Find your next
            <br />
            <span className="font-serif italic text-[#e5c58c]">
              unforgettable journey.
            </span>
          </h1>

          <p className="mt-6 max-w-xl leading-7 text-white/60">
            Discover carefully curated travel packages designed to make every
            moment of your journey extraordinary.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/10 px-4 py-2">
              ✦ Handpicked destinations
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2">
              ✦ Best travel experiences
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:px-10">
        {/* Search Bar */}
        <div className="mb-10 rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Search Destination
              </label>

              <input
                type="text"
                placeholder="Search destination or package..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#c49a55]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Travelers
              </label>

              <select
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#c49a55]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
                  <option key={number} value={number}>
                    {number} {number === 1 ? "Traveler" : "Travelers"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Heading and Sorting */}
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Explore Tour Packages</h2>

            <p className="mt-2 text-sm text-gray-500">
              Showing {filteredPackages.length} of {packages.length} packages
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-500">Sort by</label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#c49a55]"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Filters + Package Cards */}
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Filter Sidebar */}
          <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">Filters</h3>

              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-[#c49a55] hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Destination */}
            <div className="mb-8">
              <h4 className="mb-4 text-sm font-bold">Destination</h4>

              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#c49a55]"
              >
                {destinations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="mb-8">
              <h4 className="mb-4 text-sm font-bold">Trip Duration</h4>

              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#c49a55]"
              >
                <option value="All Durations">All Durations</option>
                <option value="1-3 Days">1 - 3 Days</option>
                <option value="4-5 Days">4 - 5 Days</option>
                <option value="6-7 Days">6 - 7 Days</option>
                <option value="8+ Days">8+ Days</option>
              </select>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold">Maximum Budget</h4>
              </div>

              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#c49a55]"
              />

              <div className="mt-3 flex justify-between text-xs text-gray-500">
                <span>₹10,000</span>
                <span className="font-bold text-[#1b2638]">
                  {formatPrice(maxPrice)}
                </span>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="w-full rounded-xl bg-[#1b2638] py-3 font-semibold text-white transition hover:bg-[#c49a55]"
            >
              Reset Filters
            </button>
          </aside>

          {/* Package Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">
                <TravelLoader label="Finding your next adventure" />
              </div>
            ) : loadError ? (
              <div
                role="alert"
                className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center"
              >
                <h3 className="text-2xl font-bold">Unable to load packages</h3>
                <p className="mt-3 max-w-md text-gray-500">{loadError}</p>
                <button
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-6 rounded-full bg-[#1b2638] px-6 py-3 font-semibold text-white transition hover:bg-[#c49a55]"
                >
                  Try Again
                </button>
              </div>
            ) : filteredPackages.length > 0 ? (
              <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg._id}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={
                          pkg.images?.[0] ||
                          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85"
                        }
                        alt={pkg.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />

                      <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-2 text-xs font-bold">
                        {pkg.category}
                      </span>

                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <p className="text-xs text-gray-500">
                        ⌖ {pkg.destination}
                      </p>

                      <h3 className="mt-2 line-clamp-2 min-h-[48px] text-lg font-bold">
                        {pkg.title}
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        {pkg.duration}
                      </p>

                      <div className="mt-8 border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-500">Starting from</p>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xl font-bold">
                              {formatPrice(pkg.price)}
                            </p>

                            <p className="text-xs text-gray-400">per person</p>
                          </div>

                          <a
                            href={`/packages/${pkg._id}?travelers=${encodeURIComponent(
                              travelers,
                            )}`}
                            className="rounded-full bg-[#1b2638] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#c49a55]"
                          >
                            View Details →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* No Results */
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center">
                <div className="mb-5 text-6xl">🌍</div>

                <h3 className="text-2xl font-bold">No packages found</h3>

                <p className="mt-3 max-w-md text-gray-500">
                  We couldn&apos;t find any packages matching your selected
                  filters. Try changing your search criteria.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-6 rounded-full bg-[#1b2638] px-6 py-3 font-semibold text-white transition hover:bg-[#c49a55]"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20 md:px-10">
        <div className="mx-auto max-w-7xl rounded-3xl bg-[#1b2638] px-8 py-16 text-center text-white md:px-16">
          <p className="mb-4 text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
            Your next adventure awaits
          </p>

          <h2 className="text-3xl font-bold md:text-5xl">
            Ready to explore the world?
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/60">
            Find your dream destination and start creating unforgettable
            memories today.
          </p>

          <a
            href="/#packages"
            className="mt-8 inline-block rounded-full bg-[#c49a55] px-8 py-4 font-semibold text-white transition hover:bg-[#b18742]"
          >
            Explore More Packages →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111a28] px-5 py-10 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <BrandLogo variant="light" />

            <div className="flex flex-wrap gap-6 text-sm text-white/50">
              <a href="/" className="hover:text-[#c49a55]">
                Home
              </a>
              <a href="/packages" className="hover:text-[#c49a55]">
                Packages
              </a>
              <a href="/login" className="hover:text-[#c49a55]">
                Login
              </a>
              <a href="/register" className="hover:text-[#c49a55]">
                Register
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © 2026 Manchale Travelers. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
