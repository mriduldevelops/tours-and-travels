"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthNavActions from "@/components/AuthNavActions";

const formatPrice = (price) => `₹${price.toLocaleString("en-IN")}`;

export default function PackageDetailsPage() {
  const params = useParams();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageLoading, setPackageLoading] = useState(true);
  const [packageError, setPackageError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState(2);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPackage() {
      setPackageLoading(true);
      setPackageError("");
      setSelectedPackage(null);
      setActiveImage(0);

      try {
        const response = await fetch(
          `/api/packages/${encodeURIComponent(params.id)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch package");
        }

        if (!data.package) {
          throw new Error("The package response is invalid");
        }

        setSelectedPackage(data.package);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          setPackageError(
            error instanceof Error ? error.message : "Failed to fetch package",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPackageLoading(false);
        }
      }
    }

    if (params.id) {
      loadPackage();
    }

    return () => controller.abort();
  }, [params.id]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dateFromUrl = searchParams.get("date");
    const travelersFromUrl = searchParams.get("travelers");

    if (dateFromUrl) {
      setTravelDate(dateFromUrl);
    }

    if (travelersFromUrl) {
      setTravelers(Math.max(1, Number(travelersFromUrl) || 1));
    }
  }, []);

  if (packageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-5 text-gray-500">
        Loading package...
      </main>
    );
  }

  if (!selectedPackage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-5">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {packageError
              ? "Unable to Load Package"
              : "Package Not Found"}
          </h1>
          <p className="mt-4 text-gray-500">
            {packageError ||
              "The package you are looking for does not exist or is unavailable."}
          </p>
          <a
            href="/packages"
            className="mt-6 inline-block rounded-full bg-[#1b2638] px-6 py-3 text-white"
          >
            Explore Packages
          </a>
        </div>
      </main>
    );
  }

  const packageImages = selectedPackage.images?.length
    ? selectedPackage.images
    : [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85",
      ];
  const totalPrice = selectedPackage.price * travelers;

  const today = new Date();
  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1b2638]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">
          <a href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-[#c49a55]">W</span>anderlust.
          </a>

          <div className="hidden gap-8 text-sm font-medium md:flex">
            <a href="/" className="hover:text-[#c49a55]">
              Home
            </a>
            <a href="/packages" className="text-[#c49a55]">
              Packages
            </a>
            <a href="/#destinations" className="hover:text-[#c49a55]">
              Destinations
            </a>
            <a href="/#reviews" className="hover:text-[#c49a55]">
              Reviews
            </a>
          </div>

          <AuthNavActions variant="detail" />
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-10">
        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-[#c49a55]">
            Home
          </a>
          <span>/</span>
          <a href="/packages" className="hover:text-[#c49a55]">
            Packages
          </a>
          <span>/</span>
          <span className="font-medium text-[#1b2638]">
            {selectedPackage.title}
          </span>
        </div>
      </div>

      {/* Image Gallery */}
      <section className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="grid gap-4 overflow-hidden rounded-3xl md:grid-cols-3">
          <div className="relative h-[350px] overflow-hidden md:col-span-2 md:h-[520px]">
            <img
              src={packageImages[activeImage]}
              alt={selectedPackage.title}
              className="h-full w-full object-cover transition duration-500"
            />

            <span className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-bold">
              {selectedPackage.category}
            </span>

          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {packageImages
              .filter((_, index) => index !== activeImage)
              .slice(0, 2)
              .map((image, index) => (
                <button
                  key={image}
                  onClick={() => {
                    setActiveImage(packageImages.indexOf(image));
                  }}
                  className="relative h-40 overflow-hidden rounded-2xl md:h-[252px]"
                >
                  <img
                    src={image}
                    alt={`${selectedPackage.title} gallery ${index + 1}`}
                    className="h-full w-full object-cover transition duration-500 hover:scale-110"
                  />
                </button>
              ))}
          </div>
        </div>
      </section>

      {/* Main Details */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:px-10">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left Content */}
          <div className="lg:col-span-2">
            {/* Overview */}
            <div className="border-b border-gray-200 pb-8">
              <p className="text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
                Premium Travel Experience
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                {selectedPackage.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>⌖ {selectedPackage.destination}</span>
                <span>
                  ◷ {selectedPackage.duration}
                </span>
              </div>

              <p className="mt-6 leading-8 text-gray-500">
                {selectedPackage.description}
              </p>
            </div>

            {/* Highlights */}
            <div className="border-b border-gray-200 py-8">
              <h2 className="text-2xl font-bold">Package Highlights</h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  "Carefully curated itinerary",
                  "Premium accommodation",
                  "Beautiful sightseeing locations",
                  "Comfortable transportation",
                ].map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-center gap-3 rounded-xl bg-white p-4"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5ead7] text-[#c49a55]">
                      ✓
                    </span>
                    <span className="text-sm font-medium">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="border-b border-gray-200 py-8">
              <h2 className="text-2xl font-bold">Tour Itinerary</h2>

              <p className="mt-3 text-sm text-gray-500">
                Explore your journey day by day.
              </p>

              <div className="mt-8 space-y-6">
                {(selectedPackage.itinerary || []).map((item) => (
                  <div key={item.day} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1b2638] text-sm font-bold text-white">
                        {String(item.day).padStart(2, "0")}
                      </div>

                      {item.day !==
                        (selectedPackage.itinerary || []).length && (
                        <div className="mt-2 min-h-12 w-px bg-[#e5d4b8]" />
                      )}
                    </div>

                    <div className="pb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#c49a55]">
                        Day {item.day}
                      </p>

                      <h3 className="mt-2 text-lg font-bold">{item.title}</h3>

                      <p className="mt-3 leading-7 text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions and Exclusions */}
            <div className="grid gap-8 border-b border-gray-200 py-8 sm:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold">What&apos;s Included</h2>

                <div className="mt-5 space-y-4">
                  {(selectedPackage.inclusions || []).map((item) => (
                    <div
                      key={item}
                      className="flex gap-3 text-sm text-gray-500"
                    >
                      <span className="font-bold text-green-600">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold">What&apos;s Excluded</h2>

                <div className="mt-5 space-y-4">
                  {(selectedPackage.exclusions || []).map((item) => (
                    <div
                      key={item}
                      className="flex gap-3 text-sm text-gray-500"
                    >
                      <span className="font-bold text-red-500">✕</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Booking Sidebar */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-lg">
              <p className="text-sm text-gray-500">Starting from</p>

              <div className="mt-2 flex items-end gap-2">
                <h2 className="text-3xl font-bold">
                  {formatPrice(selectedPackage.price)}
                </h2>
                <span className="mb-1 text-sm text-gray-400">/ person</span>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <label className="mb-2 block text-sm font-bold">
                  Travel Date
                </label>

                <input
                  type="date"
                  min={minimumDate}
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#c49a55]"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold">
                  Number of Travelers
                </label>

                <select
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#c49a55]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                    <option key={number} value={number}>
                      {number} {number === 1 ? "Traveler" : "Travelers"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Summary */}
              <div className="mt-6 space-y-4 rounded-2xl bg-[#faf9f6] p-5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>
                    {formatPrice(selectedPackage.price)} × {travelers}
                  </span>

                  <span className="font-semibold text-[#1b2638]">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Total Amount</span>

                    <span className="text-2xl font-bold text-[#c49a55]">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Button */}
              <a
                href={`/checkout?packageId=${selectedPackage._id}&date=${encodeURIComponent(
                  travelDate,
                )}&travelers=${travelers}`}
                onClick={(e) => {
                  if (!travelDate) {
                    e.preventDefault();
                    alert("Please select your travel date.");
                  }
                  if (travelDate && travelDate < minimumDate) {
                    e.preventDefault();
                    alert("Please select a future travel date.");
                  }
                }}
                className="mt-6 block w-full rounded-full bg-[#1b2638] py-4 text-center font-bold text-white transition hover:bg-[#c49a55]"
              >
                Book Now →
              </a>

              <p className="mt-4 text-center text-xs text-gray-400">
                Secure booking · Easy payment
              </p>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5ead7]">
                    <span className="text-[#c49a55]">✦</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold">Need assistance?</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Our travel experts are here to help.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111a28] px-5 py-10 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <a href="/" className="text-2xl font-bold">
              <span className="text-[#c49a55]">W</span>anderlust.
            </a>

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
            © 2026 Wanderlust Travel. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
