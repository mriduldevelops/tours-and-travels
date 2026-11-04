"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import TravelLoader from "@/components/TravelLoader";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your profile.");
        }

        setProfile(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Unable to load your profile.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to update your profile.");
      }

      setProfile(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
      setSuccess(data.message);
    } catch (saveError) {
      setError(saveError.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setError("");

    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to log out.");
      }

      router.replace("/");
      router.refresh();
    } catch (logoutError) {
      setError(logoutError.message || "Unable to log out.");
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1b2638]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 md:px-10">
          <BrandLogo />
          <a
            href="/"
            className="text-sm font-semibold text-gray-600 transition hover:text-[#c49a55]"
          >
            Back to home
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-12 md:px-10 md:py-16">
        <p className="text-xs font-bold uppercase tracking-[3px] text-[#c49a55]">
          Account
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Your profile</h1>
        <p className="mt-3 text-gray-500">
          View and update the details associated with your account.
        </p>

        {error && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
            role="status"
          >
            {success}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm md:p-8">
          {loading ? (
            <TravelLoader label="Getting your profile ready" />
          ) : profile ? (
            <>
              <div className="mb-8 flex items-center gap-4 border-b border-gray-100 pb-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5ead7] text-lg font-bold text-[#1b2638]">
                  {profile.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold">{profile.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Full name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={100}
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#c49a55]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Email address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#c49a55]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-[#1b2638] py-3.5 font-bold text-white transition hover:bg-[#c49a55] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <TravelLoader compact label="Saving changes..." />
                  ) : (
                    "Save changes"
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full rounded-full border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <TravelLoader compact label="Logging out..." />
                  ) : (
                    "Logout"
                  )}
                </button>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              Your profile could not be loaded.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
