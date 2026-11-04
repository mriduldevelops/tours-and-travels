"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import TravelLoader from "@/components/TravelLoader";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      router.push("/");
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
            "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=90')",
        }}
      >
        <div className="absolute inset-0 bg-[#101b2b]/50" />

        <div className="absolute bottom-16 left-16 max-w-lg text-white">
          <p className="text-xs font-bold uppercase tracking-[4px] text-[#e5c58c]">
            Start your journey
          </p>

          <h1 className="mt-5 text-5xl font-bold leading-tight">
            The world is waiting
            <br />
            <span className="font-serif italic text-[#e5c58c]">for you.</span>
          </h1>

          <p className="mt-5 leading-8 text-white/70">
            Create your account and discover extraordinary travel experiences
            around the world.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <BrandLogo />

          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
              Create Account
            </p>

            <h2 className="mt-3 text-3xl font-bold">Join Manchale Travelers</h2>

            <p className="mt-3 text-sm text-gray-500">
              Create an account to book your dream vacation.
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
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition focus:border-[#c49a55]"
              />
            </div>

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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition focus:border-[#c49a55]"
              />

              <p className="mt-2 text-xs text-gray-400">
                Minimum 8 characters.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition focus:border-[#c49a55]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1b2638] py-4 font-bold text-white transition hover:bg-[#c49a55] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <TravelLoader compact label="Creating your account..." />
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-[#c49a55] hover:underline"
            >
              Login
            </a>
          </p>

          <p className="mt-8 text-center text-xs text-gray-400">
            © 2026 Manchale Travelers
          </p>
        </div>
      </div>
    </main>
  );
}
