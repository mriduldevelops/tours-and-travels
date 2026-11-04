export default function BrandLogo({ variant = "dark", className = "" }) {
  const wordmarkColor =
    variant === "light" ? "text-white" : "text-[#173f46]";

  return (
    <a
      href="/"
      aria-label="Manchale Travelers home"
      className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-11 w-11 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="23" fill="#173F46" />
        <circle cx="32" cy="14" r="5" fill="#D6B36A" />
        <path
          d="M5.5 35.5 17 20l7 8 7-10 11.5 17.5H5.5Z"
          fill="#F8F5EC"
        />
        <path
          d="M10 39c5-4 9-5 13-2s8 4 15-1"
          stroke="#D6B36A"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      </svg>

      <span className={`flex flex-col leading-none ${wordmarkColor}`}>
        <span className="font-serif text-[20px] font-semibold tracking-[-0.04em]">
          Manchale
        </span>
        <span className="mt-1 text-[9px] font-bold tracking-[0.25em]">
          TRAVELERS
        </span>
      </span>
    </a>
  );
}
