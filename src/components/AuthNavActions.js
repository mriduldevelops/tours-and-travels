"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AuthNavActions({ variant = "packages" }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);

    const controller = new AbortController();

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          signal: controller.signal,
        });

        if (response.status === 401) {
          setStatus("signed-out");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your account.");
        }

        setUser(data.user);
        setStatus("signed-in");
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Unable to load your account.");
          setStatus("error");
        }
      }
    }

    loadCurrentUser();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
      setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const containerClassName = "flex items-center gap-3";
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/packages", label: "Packages" },
    { href: "/#destinations", label: "Destinations" },
    { href: "/#reviews", label: "Reviews" },
  ];
  const initials = user?.name
    ?.split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const desktopActions =
    status === "loading" ? (
      <div className="hidden h-10 w-10 md:block" aria-label="Loading account" />
    ) : status === "error" ? (
      <div className="hidden text-right text-xs text-red-600 md:block" role="status">
      Account unavailable<span className="sr-only">: {error}</span>
      </div>
    ) : status === "signed-in" ? (
      <a
      href="/profile"
      aria-label="View profile"
      title="Profile"
      className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#1b2638] text-white transition hover:bg-[#c49a55] md:flex"
      >
      <ProfileIcon />
      </a>
    ) : variant === "detail" ? (
      <a
      href="/login"
      className="hidden rounded-full bg-[#1b2638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c49a55] md:inline-flex"
      >
      Login
      </a>
    ) : variant === "home" ? (
      <>
      <a href="/login" className="hidden text-sm font-semibold md:block">
        Login
      </a>
      <a
        href="/register"
        className="hidden rounded-full bg-[#1b2638] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c49a55] md:inline-flex"
      >
        Sign Up
      </a>
      </>
    ) : (
      <>
      <a
        href="/login"
        className="hidden rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold md:inline-flex"
      >
        Login
      </a>
      <a
        href="/register"
        className="hidden rounded-full bg-[#1b2638] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c49a55] md:inline-flex"
      >
        Sign Up
      </a>
      </>
    );

  return (
    <>
      <div className={containerClassName}>
      {desktopActions}
      <button
        type="button"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[#1b2638] md:hidden"
      >
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      </div>

      {portalReady &&
      createPortal(
        <div
          className={`fixed inset-0 z-[60] md:hidden ${
            menuOpen ? "visible" : "invisible"
          }`}
          aria-hidden={!menuOpen}
        >
          <button
            type="button"
            tabIndex={menuOpen ? 0 : -1}
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className={`absolute right-0 top-0 flex h-full w-[min(85vw,360px)] flex-col bg-white px-6 pb-8 pt-6 shadow-2xl transition-transform duration-300 ease-in-out ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <span className="text-lg font-bold">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="flex flex-col gap-1 border-b border-gray-100 py-5">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 font-medium transition hover:bg-[#faf9f6] hover:text-[#c49a55]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {status === "signed-in" ? (
              <a
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="mt-5 flex items-center gap-3 rounded-xl bg-[#faf9f6] p-4 transition hover:bg-[#f5ead7]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1b2638] text-sm font-bold text-white">
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-gray-500">
                    Signed in as
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold">
                    {user.name}
                  </span>
                </span>
                <span className="ml-auto">
                  <ProfileIcon />
                </span>
              </a>
            ) : status === "error" ? (
              <p className="mt-5 text-sm text-red-600" role="status">
                Account unavailable. Please try again later.
              </p>
            ) : status === "signed-out" ? (
              <div className="mt-5 flex flex-col gap-3">
                <a
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-gray-200 px-5 py-3 text-center text-sm font-semibold"
                >
                  Login
                </a>
                <a
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full bg-[#1b2638] px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Sign Up
                </a>
              </div>
            ) : (
              <p className="mt-5 text-sm text-gray-500">
                Loading account...
              </p>
            )}
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 shrink-0"
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
      d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
      d="m6 6 12 12M18 6 6 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      />
    </svg>
  );
}
