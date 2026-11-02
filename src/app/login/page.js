"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      const next = searchParams.get("next");

      // Only allow internal paths to avoid open redirects.
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : data.user.role === "admin"
            ? "/admin/dashboard"
            : "/my-bookings";

      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-[#faf9f6]">
      {/* Left Image */}
      <div
        className="relative hidden w-1/2 bg-cover bg-center lg:block"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90')",
        }}
      >
        <div className="absolute inset-0 bg-[#101b2b]/50" />

        <div className="absolute bottom-16 left-16 max-w-lg text-white">
          <p className="text-xs font-bold uppercase tracking-[4px] text-[#e5c58c]">
            Welcome back
          </p>

          <h1 className="mt-5 text-5xl font-bold leading-tight">
            Your next adventure
            <br />
            <span className="font-serif italic text-[#e5c58c]">awaits.</span>
          </h1>

          <p className="mt-5 leading-8 text-white/70">
            Sign in to manage your bookings and explore extraordinary
            destinations.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="text-2xl font-bold tracking-tight text-[#1b2638]"
          >
            <span className="text-[#c49a55]">W</span>anderlust.
          </a>

          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
              Welcome Back
            </p>

            <h2 className="mt-3 text-3xl font-bold">Login to your account</h2>

            <p className="mt-3 text-sm text-gray-500">
              Access your bookings and travel experiences.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition focus:border-[#c49a55]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={128}
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition focus:border-[#c49a55]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1b2638] py-4 font-bold text-white transition hover:bg-[#c49a55] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login →"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="font-bold text-[#c49a55] hover:underline"
            >
              Register
            </a>
          </p>

          <p className="mt-8 text-center text-xs text-gray-400">
            © 2026 Wanderlust Travel
          </p>
        </div>
      </div>
    </main>
  );
}
