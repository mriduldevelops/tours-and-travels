"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/#destinations", label: "Destinations" },
  { href: "/#reviews", label: "Reviews" },
];

export default function NavLinks({ mobile = false, onNavigate }) {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setActiveHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  return links.map((link) => {
    const active =
      link.href === "/"
        ? pathname === "/" &&
          activeHash !== "#destinations" &&
          activeHash !== "#reviews"
        : link.href === "/packages"
          ? pathname === "/packages" || pathname.startsWith("/packages/")
          : pathname === "/" && activeHash === link.href.slice(1);

    const className = mobile
      ? `rounded-lg px-3 py-3 font-medium transition ${
          active
            ? "bg-[#f5ead7] text-[#c49a55]"
            : "hover:bg-[#faf9f6] hover:text-[#c49a55]"
        }`
      : `transition-colors hover:text-[#c49a55] ${
          active ? "text-[#c49a55]" : ""
        }`;

    return (
      <a
        key={link.label}
        href={link.href}
        aria-current={
          active ? (link.href.includes("#") ? "location" : "page") : undefined
        }
        onClick={() => {
          const hashIndex = link.href.indexOf("#");
          setActiveHash(hashIndex === -1 ? "" : link.href.slice(hashIndex));
          onNavigate?.();
        }}
        className={className}
      >
        {link.label}
      </a>
    );
  });
}
