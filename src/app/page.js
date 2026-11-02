"use client";

import { useState } from "react";
import AuthNavActions from "@/components/AuthNavActions";

const packages = [
  {
    id: 1,
    title: "Bali Tropical Escape",
    location: "Bali, Indonesia",
    duration: "6 Days / 5 Nights",
    price: 45999,
    rating: 4.9,
    category: "Beach",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    title: "Swiss Alps Adventure",
    location: "Switzerland",
    duration: "7 Days / 6 Nights",
    price: 89999,
    rating: 4.8,
    category: "Adventure",
    image:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,
    title: "Maldives Luxury Retreat",
    location: "Maldives",
    duration: "5 Days / 4 Nights",
    price: 69999,
    rating: 5.0,
    category: "Beach",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=85",
  },
];

const destinations = [
  {
    name: "Bali",
    country: "Indonesia",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Swiss Alps",
    country: "Switzerland",
    image:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Maldives",
    country: "Indian Ocean",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Santorini",
    country: "Greece",
    image:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=700&q=85",
  },
];

export default function Home() {
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState("2");

  function handleSearch(e) {
    e.preventDefault();

    const params = new URLSearchParams({
      destination,
      date: travelDate,
      travelers,
    });

    window.location.href = `/packages?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1b2638]">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">
          <a href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-[#c49a55]">W</span>anderlust
            <span className="text-[#c49a55]">.</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="/" className="hover:text-[#c49a55]">
              Home
            </a>
            <a href="/packages" className="hover:text-[#c49a55]">
              Packages
            </a>
            <a href="#destinations" className="hover:text-[#c49a55]">
              Destinations
            </a>
            <a href="#reviews" className="hover:text-[#c49a55]">
              Reviews
            </a>
          </div>

          <AuthNavActions variant="home" />
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex min-h-[720px] items-center justify-center bg-cover bg-center pt-20 md:min-h-[780px]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=90')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#101b2b]/80 via-[#101b2b]/40 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-20 md:px-10">
          <div className="max-w-3xl">
            <span className="mb-6 inline-block rounded-full border border-white/30 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[3px] text-white backdrop-blur">
              Explore the extraordinary
            </span>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              Discover the
              <br />
              <span className="font-serif italic text-[#e5c58c]">
                world&apos;s beauty.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/80 md:text-lg">
              Curated journeys, unforgettable destinations, and extraordinary
              experiences. Your next adventure begins here.
            </p>

            <a
              href="#packages"
              className="mt-8 inline-block rounded-full bg-[#c49a55] px-8 py-4 font-semibold text-white transition hover:bg-[#b18742]"
            >
              Explore Packages →
            </a>
          </div>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="mt-14 grid gap-4 rounded-2xl bg-white p-5 shadow-2xl md:grid-cols-4 md:items-end md:p-7"
          >
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Destination
              </label>
              <input
                type="text"
                placeholder="Where do you want to go?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#c49a55]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Travel Date
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#c49a55]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Travelers
              </label>
              <select
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#c49a55]"
              >
                <option value="1">1 Traveler</option>
                <option value="2">2 Travelers</option>
                <option value="3">3 Travelers</option>
                <option value="4">4 Travelers</option>
                <option value="5">5+ Travelers</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[#1b2638] px-6 py-3.5 font-semibold text-white transition hover:bg-[#c49a55]"
            >
              Search Trips
            </button>
          </form>
        </div>
      </section>

      {/* Featured Packages */}
      <section id="packages" className="mx-auto max-w-7xl px-5 py-24 md:px-10">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
              Handpicked experiences
            </p>
            <h2 className="text-4xl font-bold md:text-5xl">
              Popular <span className="font-serif italic">packages</span>
            </h2>
            <p className="mt-4 text-gray-500">
              Discover our most loved destinations and curated journeys.
            </p>
          </div>

          <a
            href="/packages"
            className="font-semibold text-[#c49a55] hover:underline"
          >
            View all packages →
          </a>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={pkg.image}
                  alt={pkg.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#1b2638]">
                  {pkg.category}
                </span>

                <span className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-2 text-sm text-white backdrop-blur">
                  ★ {pkg.rating}
                </span>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-500">⌖ {pkg.location}</p>

                <h3 className="mt-2 text-xl font-bold">{pkg.title}</h3>

                <p className="mt-3 text-sm text-gray-500">◷ {pkg.duration}</p>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-xs text-gray-500">Starting from</p>
                    <p className="text-2xl font-bold">
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-400">per person</p>
                  </div>

                  <a
                    href={`/packages/${pkg.id}`}
                    className="rounded-full bg-[#1b2638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c49a55]"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
              Find your paradise
            </p>
            <h2 className="text-4xl font-bold md:text-5xl">
              Explore <span className="font-serif italic">destinations</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {destinations.map((destination) => (
              <a
                key={destination.name}
                href={`/packages?destination=${encodeURIComponent(destination.name)}`}
                className="group relative h-72 overflow-hidden rounded-2xl md:h-96"
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                <div className="absolute bottom-6 left-5 text-white">
                  <p className="text-sm text-white/70">{destination.country}</p>
                  <h3 className="mt-1 text-2xl font-bold">
                    {destination.name}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-10">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
              Travel with confidence
            </p>

            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              Your journey,
              <br />
              <span className="font-serif italic">our passion.</span>
            </h2>

            <p className="mt-6 leading-8 text-gray-500">
              We believe every journey should be extraordinary. Our carefully
              curated packages bring together beautiful destinations, memorable
              experiences, and exceptional service.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-3xl font-bold text-[#c49a55]">500+</h3>
                <p className="mt-2 text-sm text-gray-500">Happy Travelers</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-[#c49a55]">50+</h3>
                <p className="mt-2 text-sm text-gray-500">Destinations</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-[#c49a55]">4.9/5</h3>
                <p className="mt-2 text-sm text-gray-500">Customer Rating</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-[#c49a55]">24/7</h3>
                <p className="mt-2 text-sm text-gray-500">Travel Support</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85"
              alt="Beautiful mountain landscape"
              className="h-[500px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="bg-[#1b2638] py-24 text-white">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
              Guest experiences
            </p>
            <h2 className="text-4xl font-bold md:text-5xl">
              Stories from our{" "}
              <span className="font-serif italic">travelers</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Aarav Sharma",
                place: "Bali Trip",
                review:
                  "An absolutely wonderful experience! Everything was beautifully planned and the trip exceeded our expectations.",
              },
              {
                name: "Priya Verma",
                place: "Maldives Trip",
                review:
                  "The perfect luxury getaway. Amazing hotels, breathtaking views, and excellent support throughout.",
              },
              {
                name: "Rahul Mehta",
                place: "Swiss Alps Trip",
                review:
                  "A dream vacation made easy. The itinerary and arrangements were fantastic. Highly recommended!",
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-8"
              >
                <p className="text-lg tracking-widest text-[#e5c58c]">★★★★★</p>
                <p className="mt-5 leading-8 text-white/80">
                  &quot;{review.review}&quot;
                </p>
                <div className="mt-8 border-t border-white/10 pt-5">
                  <h3 className="font-bold">{review.name}</h3>
                  <p className="mt-1 text-sm text-[#c49a55]">{review.place}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111a28] px-5 py-12 text-white md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          <div>
            <a href="/" className="text-2xl font-bold">
              <span className="text-[#c49a55]">W</span>anderlust.
            </a>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">
              Discover extraordinary destinations and create unforgettable
              memories with our curated travel experiences.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Quick Links</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/50">
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

          <div>
            <h3 className="font-bold">Contact Us</h3>
            <p className="mt-4 text-sm leading-7 text-white/50">
              Email: support@wanderlust.com
              <br />
              Phone: +91 98765 43210
              <br />
              India
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © 2026 Wanderlust Travel. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
